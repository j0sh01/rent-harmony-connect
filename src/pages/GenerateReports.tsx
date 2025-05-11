import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { frappeClient } from "@/integrations/frappe/client";
import { toast } from "sonner";
import { FileText, Download, BarChart, PieChart, Users, Building, CreditCard, Calendar, Printer, Share2, Filter } from 'lucide-react';
import { 
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const GenerateReports = () => {
  const navigate = useNavigate();
  const [reportType, setReportType] = useState("financial");
  const [dateRange, setDateRange] = useState("month");
  const [startDate, setStartDate] = useState<Date | undefined>(new Date());
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [reportData, setReportData] = useState<any>(null);
  const [selectedOptions, setSelectedOptions] = useState({
    includeProperties: true,
    includeTenants: true,
    includeRentals: true,
    includePayments: true,
    includeExpiring: true,
    includePending: true,
    includeOccupancyTrends: true,
    includeRevenueAnalysis: true
  });

  const handleOptionChange = (option: string, checked: boolean) => {
    setSelectedOptions(prev => ({
      ...prev,
      [option]: checked
    }));
  };

  const handleDateRangeChange = (range: string) => {
    setDateRange(range);
    const today = new Date();
    let start = new Date();
    
    switch (range) {
      case "month":
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        break;
      case "quarter":
        const quarter = Math.floor(today.getMonth() / 3);
        start = new Date(today.getFullYear(), quarter * 3, 1);
        break;
      case "year":
        start = new Date(today.getFullYear(), 0, 1);
        break;
      case "custom":
        // Keep current dates for custom range
        return;
    }
    
    setStartDate(start);
    setEndDate(today);
  };

  const generateReport = async () => {
    if (!startDate || !endDate) {
      toast.error("Please select a valid date range");
      return;
    }

    setLoading(true);
    setProgress(0);
    
    try {
      // Collect all the data based on selected options
      const reportData: any = {
        generatedAt: new Date().toISOString(),
        reportType,
        dateRange: {
          start: startDate.toISOString(),
          end: endDate.toISOString()
        },
        summary: {}
      };

      // Fetch dashboard stats for overview
      setProgress(10);
      const dashboardStats = await frappeClient.getDashboardStats();
      if (dashboardStats.success) {
        reportData.summary = {
          propertyCount: dashboardStats.data.propertyCount || 0,
          tenantCount: dashboardStats.data.tenantCount || 0,
          activeRentalCount: dashboardStats.data.activeRentalCount || 0,
          totalRevenue: dashboardStats.data.totalRevenue || 0,
          occupancyRate: Math.round(((dashboardStats.data.activeRentalCount || 0) / 
                                    (dashboardStats.data.propertyCount || 1)) * 100)
        };
      }
      
      setProgress(20);

      // Fetch detailed data based on options
      if (selectedOptions.includeProperties) {
        const propertiesResult = await frappeClient.getProperties();
        if (propertiesResult.success) {
          reportData.properties = propertiesResult.data;
          
          // Calculate property type distribution for pie chart
          if (propertiesResult.data && propertiesResult.data.length > 0) {
            const propertyTypes: Record<string, number> = {};
            propertiesResult.data.forEach(property => {
              const type = property.property_type || 'Other';
              propertyTypes[type] = (propertyTypes[type] || 0) + 1;
            });
            
            reportData.propertyAnalytics = {
              typeDistribution: Object.entries(propertyTypes).map(([name, value]) => ({ name, value }))
            };
          }
        }
      }
      
      setProgress(40);

      if (selectedOptions.includeTenants) {
        const tenantsResult = await frappeClient.getTenants();
        if (tenantsResult.success) {
          reportData.tenants = tenantsResult.data;
          
          // Calculate tenant metrics
          if (tenantsResult.data && tenantsResult.data.length > 0) {
            // Tenant duration analysis
            const tenantDurations: Record<string, number> = {
              'Less than 6 months': 0,
              '6-12 months': 0,
              '1-2 years': 0,
              '2+ years': 0
            };
            
            tenantsResult.data.forEach(tenant => {
              if (tenant.created_at) {
                const createdDate = new Date(tenant.created_at);
                const now = new Date();
                const monthsDiff = (now.getFullYear() - createdDate.getFullYear()) * 12 + 
                                  now.getMonth() - createdDate.getMonth();
                
                if (monthsDiff < 6) tenantDurations['Less than 6 months']++;
                else if (monthsDiff < 12) tenantDurations['6-12 months']++;
                else if (monthsDiff < 24) tenantDurations['1-2 years']++;
                else tenantDurations['2+ years']++;
              }
            });
            
            reportData.tenantAnalytics = {
              durationDistribution: Object.entries(tenantDurations).map(([name, value]) => ({ name, value }))
            };
          }
        }
      }
      
      setProgress(60);

      if (selectedOptions.includeRentals) {
        const rentalsResult = await frappeClient.getRentals();
        if (rentalsResult.success) {
          reportData.rentals = rentalsResult.data;
          
          // Calculate additional rental metrics
          if (rentalsResult.data && rentalsResult.data.length > 0) {
            const totalRent = rentalsResult.data.reduce((sum, rental) => 
              sum + (rental.monthly_rent_tzs || 0), 0);
              
            // Group rentals by property for distribution analysis
            const rentalsByProperty: Record<string, number> = {};
            rentalsResult.data.forEach(rental => {
              rentalsByProperty[rental.property] = (rentalsByProperty[rental.property] || 0) + 1;
            });
            
            // Calculate rent distribution by price range
            const rentRanges: Record<string, number> = {
              'Under 100,000': 0,
              '100,000-300,000': 0,
              '300,000-500,000': 0,
              '500,000-1,000,000': 0,
              'Over 1,000,000': 0
            };
            
            rentalsResult.data.forEach(rental => {
              const rent = rental.monthly_rent_tzs || 0;
              if (rent < 100000) rentRanges['Under 100,000']++;
              else if (rent < 300000) rentRanges['100,000-300,000']++;
              else if (rent < 500000) rentRanges['300,000-500,000']++;
              else if (rent < 1000000) rentRanges['500,000-1,000,000']++;
              else rentRanges['Over 1,000,000']++;
            });
            
            reportData.rentalMetrics = {
              totalMonthlyRent: totalRent,
              averageRent: totalRent / rentalsResult.data.length,
              propertyDistribution: Object.entries(rentalsByProperty).map(([name, value]) => ({ name, value })),
              rentRangeDistribution: Object.entries(rentRanges).map(([name, value]) => ({ name, value }))
            };
          }
        }
      }
      
      setProgress(80);

      if (selectedOptions.includePayments) {
        const paymentsResult = await frappeClient.getAllPayments();
        if (paymentsResult.success && paymentsResult.data) {
          // Filter payments by date range
          const filteredPayments = paymentsResult.data.filter(payment => {
            const paymentDate = new Date(payment.payment_date);
            return paymentDate >= startDate && paymentDate <= endDate;
          });
          
          reportData.payments = filteredPayments;
          
          // Calculate payment metrics
          if (filteredPayments.length > 0) {
            const totalAmount = filteredPayments.reduce((sum, payment) => 
              sum + (payment.amount_tzs || 0), 0);
            
            // Group payments by month for trend analysis
            const paymentsByMonth: Record<string, number> = {};
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            
            filteredPayments.forEach(payment => {
              const date = new Date(payment.payment_date);
              const monthKey = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
              paymentsByMonth[monthKey] = (paymentsByMonth[monthKey] || 0) + payment.amount_tzs;
            });
            
            // Group payments by method
            const paymentMethods: Record<string, number> = {};
            filteredPayments.forEach(payment => {
              const method = payment.payment_method || 'Other';
              paymentMethods[method] = (paymentMethods[method] || 0) + 1;
            });
            
            reportData.paymentMetrics = {
              totalAmount,
              averageAmount: totalAmount / filteredPayments.length,
              paymentsByMonth: Object.entries(paymentsByMonth)
                .map(([name, value]) => ({ name, value }))
                .sort((a, b) => {
                  const [aMonth, aYear] = a.name.split(' ');
                  const [bMonth, bYear] = b.name.split(' ');
                  return (parseInt(aYear) - parseInt(bYear)) || 
                         (monthNames.indexOf(aMonth) - monthNames.indexOf(bMonth));
                }),
              paymentMethodDistribution: Object.entries(paymentMethods).map(([name, value]) => ({ name, value }))
            };
          }
        }
      }

      if (selectedOptions.includeExpiring) {
        const rentalsResult = await frappeClient.getRentals();
        if (rentalsResult.success && rentalsResult.data) {
          // Filter rentals that expire in the next 3 months
          const now = new Date();
          const threeMonthsLater = new Date(now);
          threeMonthsLater.setMonth(now.getMonth() + 3);
          
          const expiringRentals = rentalsResult.data.filter(rental => {
            const endDate = new Date(rental.end_date);
            return endDate >= now && endDate <= threeMonthsLater;
          });
          
          // Group by month of expiration
          const expirationsByMonth: Record<string, number> = {};
          const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                             'July', 'August', 'September', 'October', 'November', 'December'];
          
          expiringRentals.forEach(rental => {
            const endDate = new Date(rental.end_date);
            const monthKey = monthNames[endDate.getMonth()];
            expirationsByMonth[monthKey] = (expirationsByMonth[monthKey] || 0) + 1;
          });
          
          reportData.expiringRentals = expiringRentals;
          reportData.expirationAnalytics = {
            expirationsByMonth: Object.entries(expirationsByMonth).map(([name, value]) => ({ name, value }))
          };
        }
      }

      if (selectedOptions.includePending) {
        const pendingPaymentsResult = await frappeClient.getPendingPayments();
        if (pendingPaymentsResult.success) {
          reportData.pendingPayments = pendingPaymentsResult.data;
          
          // Calculate total pending amount
          if (pendingPaymentsResult.data && pendingPaymentsResult.data.length > 0) {
            const totalPending = pendingPaymentsResult.data.reduce((sum, payment) => 
              sum + (payment.amount_tzs || 0), 0);
              
            reportData.pendingAnalytics = {
              totalPendingAmount: totalPending,
              averagePendingAmount: totalPending / pendingPaymentsResult.data.length
            };
          }
        }
      }
      
      setProgress(100);
      setReportData(reportData);
      toast.success("Report generated successfully");
    } catch (error) {
      console.error("Error generating report:", error);
      toast.error("Failed to generate report");
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = () => {
    if (!reportData) return;
    
    // Create a formatted report
    const formattedReport = JSON.stringify(reportData, null, 2);
    const blob = new Blob([formattedReport], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `property-report-${reportType}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success("Report downloaded successfully");
  };
  
  const printReport = () => {
    if (!reportData) return;
    window.print();
    toast.success("Printing report");
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  const getReportTypeIcon = () => {
    switch(reportType) {
      case 'financial': return <CreditCard className="h-5 w-5" />;
      case 'property': return <Building className="h-5 w-5" />;
      case 'tenant': return <Users className="h-5 w-5" />;
      case 'comprehensive': return <FileText className="h-5 w-5" />;
      default: return <FileText className="h-5 w-5" />;
    }
  };

  return (
    <DashboardLayout role="admin">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Generate Reports</h1>
        <p className="text-gray-500">Create comprehensive reports for your property management business</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <div className="flex items-center">
                {getReportTypeIcon()}
                <CardTitle className="ml-2">Report Options</CardTitle>
              </div>
              <CardDescription>Configure your report parameters</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Report Type</Label>
                <Select value={reportType} onValueChange={setReportType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select report type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="financial">
                      <div className="flex items-center">
                        <CreditCard className="h-4 w-4 mr-2" />
                        <span>Financial Summary</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="property">
                      <div className="flex items-center">
                        <Building className="h-4 w-4 mr-2" />
                        <span>Property Overview</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="tenant">
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-2" />
                        <span>Tenant Analysis</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="comprehensive">
                      <div className="flex items-center">
                        <FileText className="h-4 w-4 mr-2" />
                        <span>Comprehensive Report</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Date Range</Label>
                <Select value={dateRange} onValueChange={handleDateRangeChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select date range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="month">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2" />
                        <span>Current Month</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="quarter">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2" />
                        <span>Current Quarter</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="year">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2" />
                        <span>Current Year</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="custom">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2" />
                        <span>Custom Range</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {dateRange === "custom" && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <DatePicker date={startDate} onSelect={setStartDate} />
                  </div>
                  <div className="space-y-2">
                    <Label>End Date</Label>
                    <DatePicker date={endDate} onSelect={setEndDate} />
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <Label>Include Data</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="properties" 
                      checked={selectedOptions.includeProperties}
                      onCheckedChange={(checked) => 
                        handleOptionChange('includeProperties', checked as boolean)
                      }
                    />
                    <Label htmlFor="properties" className="cursor-pointer">Properties</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="tenants" 
                      checked={selectedOptions.includeTenants}
                      onCheckedChange={(checked) => 
                        handleOptionChange('includeTenants', checked as boolean)
                      }
                    />
                    <Label htmlFor="tenants" className="cursor-pointer">Tenants</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="rentals" 
                      checked={selectedOptions.includeRentals}
                      onCheckedChange={(checked) => 
                        handleOptionChange('includeRentals', checked as boolean)
                      }
                    />
                    <Label htmlFor="rentals" className="cursor-pointer">Rental Agreements</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="payments" 
                      checked={selectedOptions.includePayments}
                      onCheckedChange={(checked) => 
                        handleOptionChange('includePayments', checked as boolean)
                      }
                    />
                    <Label htmlFor="payments" className="cursor-pointer">Payment History</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="expiring" 
                      checked={selectedOptions.includeExpiring}
                      onCheckedChange={(checked) => 
                        handleOptionChange('includeExpiring', checked as boolean)
                      }
                    />
                    <Label htmlFor="expiring" className="cursor-pointer">Expiring Leases</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="pending" 
                      checked={selectedOptions.includePending}
                      onCheckedChange={(checked) => 
                        handleOptionChange('includePending', checked as boolean)
                      }
                    />
                    <Label htmlFor="pending" className="cursor-pointer">Pending Payments</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="occupancyTrends" 
                      checked={selectedOptions.includeOccupancyTrends}
                      onCheckedChange={(checked) => 
                        handleOptionChange('includeOccupancyTrends', checked as boolean)
                      }
                    />
                    <Label htmlFor="occupancyTrends" className="cursor-pointer">Occupancy Trends</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="revenueAnalysis" 
                      checked={selectedOptions.includeRevenueAnalysis}
                      onCheckedChange={(checked) => 
                        handleOptionChange('includeRevenueAnalysis', checked as boolean)
                      }
                    />
                    <Label htmlFor="revenueAnalysis" className="cursor-pointer">Revenue Analysis</Label>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full bg-[#00b3d7] hover:bg-[#0099b8]" 
                onClick={generateReport}
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center">
                    <span className="mr-2">Generating...</span>
                    <Progress value={progress} className="w-20 h-2" />
                  </div>
                ) : "Generate Report"}
              </Button>
            </CardFooter>
          </Card>
        </div>

        <div className="lg:col-span-2">
          {reportData ? (
            <Card className="print:shadow-none">
              <CardHeader className="flex flex-row items-center justify-between print:hidden">
                <div>
                  <CardTitle>Report Results</CardTitle>
                  <CardDescription>
                    Generated on {new Date().toLocaleDateString()} for period {startDate?.toLocaleDateString()} - {endDate?.toLocaleDateString()}
                  </CardDescription>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" onClick={printReport}>
                    <Printer className="mr-2 h-4 w-4" />
                    Print
                  </Button>
                  <Button variant="outline" onClick={downloadReport}>
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="summary" className="print:block">
                  <TabsList className="mb-4 print:hidden">
                    <TabsTrigger value="summary">Summary</TabsTrigger>
                    {selectedOptions.includeProperties && <TabsTrigger value="properties">Properties</TabsTrigger>}
                    {selectedOptions.includeTenants && <TabsTrigger value="tenants">Tenants</TabsTrigger>}
                    {selectedOptions.includeRentals && <TabsTrigger value="rentals">Rentals</TabsTrigger>}
                    {selectedOptions.includePayments && <TabsTrigger value="payments">Payments</TabsTrigger>}
                    {selectedOptions.includeExpiring && <TabsTrigger value="expiring">Expiring Leases</TabsTrigger>}
                  </TabsList>
                  
                  <TabsContent value="summary">
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card>
                          <CardContent className="pt-6">
                            <div className="flex items-center">
                              <div className="mr-4 bg-blue-50 p-3 rounded-md">
                                <Building className="h-6 w-6 text-[#00b3d7]" />
                              </div>
                              <div>
                                <p className="text-3xl font-bold">{reportData.summary.propertyCount}</p>
                                <p className="text-sm text-gray-500">Properties</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                        
                        <Card>
                          <CardContent className="pt-6">
                            <div className="flex items-center">
                              <div className="mr-4 bg-blue-50 p-3 rounded-md">
                                <Users className="h-6 w-6 text-[#00b3d7]" />
                              </div>
                              <div>
                                <p className="text-3xl font-bold">{reportData.summary.tenantCount}</p>
                                <p className="text-sm text-gray-500">Tenants</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                        
                        <Card>
                          <CardContent className="pt-6">
                            <div className="flex items-center">
                              <div className="mr-4 bg-blue-50 p-3 rounded-md">
                                <CreditCard className="h-6 w-6 text-[#00b3d7]" />
                              </div>
                              <div>
                                <p className="text-3xl font-bold">
                                  {formatCurrency(reportData.summary.totalRevenue)}
                                </p>
                                <p className="text-sm text-gray-500">Total Revenue</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                      
                      <Card>
                        <CardHeader>
                          <CardTitle>Key Metrics</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="flex justify-between items-center">
                              <span className="text-gray-500">Occupancy Rate</span>
                              <span className="font-semibold">{reportData.summary.occupancyRate}%</span>
                            </div>
                            
                            {reportData.rentalMetrics && (
                              <>
                                <div className="flex justify-between items-center">
                                  <span className="text-gray-500">Total Monthly Rent</span>
                                  <span className="font-semibold">
                                    {formatCurrency(reportData.rentalMetrics.totalMonthlyRent)}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-gray-500">Average Rent</span>
                                  <span className="font-semibold">
                                    {formatCurrency(Math.round(reportData.rentalMetrics.averageRent))}
                                  </span>
                                </div>
                              </>
                            )}
                            
                            {reportData.expiringRentals && (
                              <div className="flex justify-between items-center">
                                <span className="text-gray-500">Leases Expiring Soon</span>
                                <span className="font-semibold">{reportData.expiringRentals.length}</span>
                              </div>
                            )}
                            
                            {reportData.pendingPayments && (
                              <div className="flex justify-between items-center">
                                <span className="text-gray-500">Pending Payments</span>
                                <span className="font-semibold">{reportData.pendingPayments.length}</span>
                              </div>
                            )}
                            
                            {reportData.pendingAnalytics && (
                              <div className="flex justify-between items-center">
                                <span className="text-gray-500">Total Pending Amount</span>
                                <span className="font-semibold">
                                  {formatCurrency(reportData.pendingAnalytics.totalPendingAmount)}
                                </span>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                      
                      {reportData.paymentMetrics && reportData.paymentMetrics.paymentsByMonth && (
                        <Card>
                          <CardHeader>
                            <CardTitle>Revenue Trend</CardTitle>
                            <CardDescription>Monthly revenue for the selected period</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="h-80">
                              <ResponsiveContainer width="100%" height="100%">
                                <LineChart
                                  data={reportData.paymentMetrics.paymentsByMonth}
                                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                >
                                  <CartesianGrid strokeDasharray="3 3" />
                                  <XAxis dataKey="name" />
                                  <YAxis 
                                    tickFormatter={(value) => 
                                      new Intl.NumberFormat('en-TZ', {
                                        notation: 'compact',
                                        compactDisplay: 'short',
                                        currency: 'TZS'
                                      }).format(value)
                                    }
                                  />
                                  <Tooltip 
                                    formatter={(value: any) => [
                                      formatCurrency(value), 
                                      "Revenue"
                                    ]}
                                  />
                                  <Legend />
                                  <Line 
                                    type="monotone" 
                                    dataKey="value" 
                                    name="Revenue" 
                                    stroke="#00b3d7" 
                                    activeDot={{ r: 8 }} 
                                  />
                                </LineChart>
                              </ResponsiveContainer>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </TabsContent>
                  
                  {selectedOptions.includeProperties && (
                    <TabsContent value="properties">
                      <div className="space-y-6">
                        <Card>
                          <CardHeader>
                            <CardTitle>Property Overview</CardTitle>
                            <CardDescription>
                              Total of {reportData.properties?.length || 0} properties
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            {reportData.properties && reportData.properties.length > 0 ? (
                              <div className="space-y-4">
                                {reportData.properties.slice(0, 5).map((property: any, index: number) => (
                                  <div key={index} className="flex justify-between items-center p-3 border rounded-md">
                                    <div>
                                      <p className="font-medium">{property.title}</p>
                                      <p className="text-sm text-gray-500">{property.location}</p>
                                    </div>
                                    <div className="text-right">
                                      <p className="font-bold text-[#00b3d7]">
                                        {formatCurrency(property.price_tzs || 0)}
                                      </p>
                                      <p className="text-sm text-gray-500">
                                        {property.status}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                                {reportData.properties.length > 5 && (
                                  <p className="text-center text-sm text-gray-500">
                                    + {reportData.properties.length - 5} more properties
                                  </p>
                                )}
                              </div>
                            ) : (
                              <p className="text-gray-500">No properties found</p>
                            )}
                          </CardContent>
                        </Card>
                        
                        {reportData.propertyAnalytics && reportData.propertyAnalytics.typeDistribution && (
                          <Card>
                            <CardHeader>
                              <CardTitle>Property Type Distribution</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                  <RechartsPieChart>
                                    <Pie
                                      data={reportData.propertyAnalytics.typeDistribution}
                                      cx="50%"
                                      cy="50%"
                                      labelLine={true}
                                      outerRadius={80}
                                      fill="#8884d8"
                                      dataKey="value"
                                      nameKey="name"
                                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                    >
                                      {reportData.propertyAnalytics.typeDistribution.map((_: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                      ))}
                                    </Pie>
                                    <Tooltip formatter={(value) => [`${value} properties`, 'Count']} />
                                    <Legend />
                                  </RechartsPieChart>
                                </ResponsiveContainer>
                              </div>
                            </CardContent>
                          </Card>
                        )}
                      </div>
                    </TabsContent>
                  )}
                  
                  {selectedOptions.includeTenants && (
                    <TabsContent value="tenants">
                      <div className="space-y-6">
                        <Card>
                          <CardHeader>
                            <CardTitle>Tenant Overview</CardTitle>
                            <CardDescription>
                              Total of {reportData.tenants?.length || 0} tenants
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            {reportData.tenants && reportData.tenants.length > 0 ? (
                              <div className="space-y-4">
                                {reportData.tenants.slice(0, 5).map((tenant: any, index: number) => (
                                  <div key={index} className="flex justify-between items-center p-3 border rounded-md">
                                    <div>
                                      <p className="font-medium">{tenant.full_name || `${tenant.first_name} ${tenant.last_name}`}</p>
                                      <p className="text-sm text-gray-500">{tenant.email}</p>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-sm text-gray-500">
                                        {tenant.phone || 'No phone'}
                                      </p>
                                      <p className="text-sm text-gray-500">
                                        {tenant.created_at ? `Joined: ${formatDate(tenant.created_at)}` : ''}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                                {reportData.tenants.length > 5 && (
                                  <p className="text-center text-sm text-gray-500">
                                    + {reportData.tenants.length - 5} more tenants
                                  </p>
                                )}
                              </div>
                            ) : (
                              <p className="text-gray-500">No tenants found</p>
                            )}
                          </CardContent>
                        </Card>
                        
                        {reportData.tenantAnalytics && reportData.tenantAnalytics.durationDistribution && (
                          <Card>
                            <CardHeader>
                              <CardTitle>Tenant Duration Analysis</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                  <RechartsBarChart
                                    data={reportData.tenantAnalytics.durationDistribution}
                                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                  >
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="value" name="Tenants" fill="#00b3d7" />
                                  </RechartsBarChart>
                                </ResponsiveContainer>
                              </div>
                            </CardContent>
                          </Card>
                        )}
                      </div>
                    </TabsContent>
                  )}
                  
                  {selectedOptions.includeRentals && (
                    <TabsContent value="rentals">
                      <div className="space-y-6">
                        <Card>
                          <CardHeader>
                            <CardTitle>Rental Agreements</CardTitle>
                            <CardDescription>
                              Total of {reportData.rentals?.length || 0} rental agreements
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            {reportData.rentals && reportData.rentals.length > 0 ? (
                              <div className="space-y-4">
                                {reportData.rentals.slice(0, 5).map((rental: any, index: number) => (
                                  <div key={index} className="flex justify-between items-center p-3 border rounded-md">
                                    <div>
                                      <p className="font-medium">Property: {rental.property_name || rental.property}</p>
                                      <p className="text-sm text-gray-500">Tenant: {rental.tenant_name || rental.tenant}</p>
                                    </div>
                                    <div className="text-right">
                                      <p className="font-bold text-[#00b3d7]">
                                        {formatCurrency(rental.monthly_rent_tzs || 0)}
                                      </p>
                                      <p className="text-sm text-gray-500">
                                        {formatDate(rental.start_date)} - {formatDate(rental.end_date)}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                                {reportData.rentals.length > 5 && (
                                  <p className="text-center text-sm text-gray-500">
                                    + {reportData.rentals.length - 5} more rentals
                                  </p>
                                )}
                              </div>
                            ) : (
                              <p className="text-gray-500">No rental agreements found</p>
                            )}
                          </CardContent>
                        </Card>
                        
                        {reportData.rentalMetrics && reportData.rentalMetrics.rentRangeDistribution && (
                          <Card>
                            <CardHeader>
                              <CardTitle>Rent Distribution by Price Range</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                  <RechartsBarChart
                                    data={reportData.rentalMetrics.rentRangeDistribution}
                                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                  >
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="value" name="Properties" fill="#00b3d7" />
                                  </RechartsBarChart>
                                </ResponsiveContainer>
                              </div>
                            </CardContent>
                          </Card>
                        )}
                      </div>
                    </TabsContent>
                  )}
                  
                  {selectedOptions.includePayments && (
                    <TabsContent value="payments">
                      <div className="space-y-6">
                        <Card>
                          <CardHeader>
                            <CardTitle>Payment History</CardTitle>
                            <CardDescription>
                              {reportData.payments?.length || 0} payments in selected period
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            {reportData.payments && reportData.payments.length > 0 ? (
                              <div className="space-y-4">
                                {reportData.payments.slice(0, 5).map((payment: any, index: number) => (
                                  <div key={index} className="flex justify-between items-center p-3 border rounded-md">
                                    <div>
                                      <p className="font-medium">
                                        {payment.tenant_name || payment.tenant || "Unknown Tenant"}
                                      </p>
                                      <p className="text-sm text-gray-500">
                                        {payment.property_name || payment.property || payment.rental || "Unknown Property"}
                                      </p>
                                    </div>
                                    <div className="text-right">
                                      <p className="font-bold text-[#00b3d7]">
                                        {formatCurrency(payment.amount_tzs || 0)}
                                      </p>
                                      <p className="text-sm text-gray-500">
                                        {formatDate(payment.payment_date)} • {payment.payment_method || "Unknown Method"}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                                {reportData.payments.length > 5 && (
                                  <p className="text-center text-sm text-gray-500">
                                    + {reportData.payments.length - 5} more payments
                                  </p>
                                )}
                              </div>
                            ) : (
                              <p className="text-gray-500">No payments found in the selected period</p>
                            )}
                          </CardContent>
                        </Card>
                        
                        {reportData.paymentMetrics && reportData.paymentMetrics.paymentMethodDistribution && (
                          <Card>
                            <CardHeader>
                              <CardTitle>Payment Methods</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                  <RechartsPieChart>
                                    <Pie
                                      data={reportData.paymentMetrics.paymentMethodDistribution}
                                      cx="50%"
                                      cy="50%"
                                      labelLine={true}
                                      outerRadius={80}
                                      fill="#8884d8"
                                      dataKey="value"
                                      nameKey="name"
                                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                    >
                                      {reportData.paymentMetrics.paymentMethodDistribution.map((_: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                      ))}
                                    </Pie>
                                    <Tooltip formatter={(value) => [`${value} payments`, 'Count']} />
                                    <Legend />
                                  </RechartsPieChart>
                                </ResponsiveContainer>
                              </div>
                            </CardContent>
                          </Card>
                        )}
                      </div>
                    </TabsContent>
                  )}
                  
                  {selectedOptions.includeExpiring && (
                    <TabsContent value="expiring">
                      <div className="space-y-6">
                        <Card>
                          <CardHeader>
                            <CardTitle>Expiring Leases</CardTitle>
                            <CardDescription>
                              {reportData.expiringRentals?.length || 0} leases expiring in the next 3 months
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            {reportData.expiringRentals && reportData.expiringRentals.length > 0 ? (
                              <div className="space-y-4">
                                {reportData.expiringRentals.map((rental: any, index: number) => (
                                  <div key={index} className="flex justify-between items-center p-3 border rounded-md">
                                    <div>
                                      <p className="font-medium">
                                        {rental.property_name || rental.property}
                                      </p>
                                      <p className="text-sm text-gray-500">
                                        Tenant: {rental.tenant_name || rental.tenant}
                                      </p>
                                    </div>
                                    <div className="text-right">
                                      <p className="font-bold text-red-500">
                                        Expires: {formatDate(rental.end_date)}
                                      </p>
                                      <p className="text-sm text-gray-500">
                                        {formatCurrency(rental.monthly_rent_tzs || 0)} / month
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-gray-500">No leases expiring in the next 3 months</p>
                            )}
                          </CardContent>
                        </Card>
                        
                        {reportData.expirationAnalytics && reportData.expirationAnalytics.expirationsByMonth && (
                          <Card>
                            <CardHeader>
                              <CardTitle>Lease Expirations by Month</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                  <RechartsBarChart
                                    data={reportData.expirationAnalytics.expirationsByMonth}
                                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                  >
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="value" name="Expiring Leases" fill="#ff8042" />
                                  </RechartsBarChart>
                                </ResponsiveContainer>
                              </div>
                            </CardContent>
                          </Card>
                        )}
                      </div>
                    </TabsContent>
                  )}
                </Tabs>
              </CardContent>
            </Card>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-8 border border-dashed rounded-lg">
              <FileText className="h-16 w-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium mb-2">No Report Generated Yet</h3>
              <p className="text-gray-500 text-center mb-6">Configure your report options and click "Generate Report" to create a comprehensive property management report.</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default GenerateReports;
