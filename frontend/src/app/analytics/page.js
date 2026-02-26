"use client"
import { useEffect, useState } from "react"
import {
  BarChart, Bar,
  PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, CartesianGrid,
  ResponsiveContainer
} from "recharts"

export default function AnalyticsPage() {
  const [monthlyData, setMonthlyData] = useState([])
  const [weeklyData, setWeeklyData] = useState([])
  const [dailyData, setDailyData] = useState([])
  const [paymentData, setPaymentData] = useState([])
  const [topProducts, setTopProducts] = useState([])
  const [expenseData, setExpenseData] = useState([]);
  const [weeklyExpenseData, setWeeklyExpenseData] = useState([]);

  
  
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"]
  

  useEffect(() => {
      fetch("http://127.0.0.1:8000/api/weeklyExpenceAnalysis/")
      .then(res => res.json())
      .then(data => setWeeklyExpenseData(data))
      .catch(err => console.error(err));

    fetch("http://127.0.0.1:8000/api/analytics/expenses/")
    .then(res => res.json())
    .then(data => setExpenseData(data))
    .catch(err => console.error(err));
    // Monthly sales
    fetch("http://127.0.0.1:8000/api/analytics/monthly-sales/")
      .then(res => res.json())
      .then(data => setMonthlyData(data))
      .catch(err => console.error(err))

    // Weekly sales
    fetch("http://127.0.0.1:8000/api/analytics/weekly-sales/")
      .then(res => res.json())
      .then(data => {
        const formatted = data.map(d => ({
          week_starting: d.week_starting, 
          total: Number(d.total)
        }))
        setWeeklyData(formatted)
      })
      .catch(err => console.error(err))

    // Daily sales
    fetch("http://127.0.0.1:8000/api/analytics/daily-sales/")
      .then(res => res.json())
      .then(data => {
        const formatted = data.map(d => ({
          day: d.day, 
          total: Number(d.total)
        }))
        setDailyData(formatted)
      })
      .catch(err => console.error(err))

    // Payment breakdown
    fetch("http://127.0.0.1:8000/api/analytics/payment-breakdown/")
      .then(res => res.json())
      .then(data => setPaymentData(data))
      .catch(err => console.error(err))

    // Top products
    fetch("http://127.0.0.1:8000/api/analytics/top-products/")
      .then(res => res.json())
      .then(data => setTopProducts(data))
      .catch(err => console.error(err))
  }, [])

  return (
    <div className="p-6 min-h-screen bg-gradient-to-br from-[#0f172a] via-[#111827] to-[#1e293b] text-white">
      <h1 className="text-4xl font-bold mb-10 text-center">Business Analytics Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Monthly Sales */}
        <div className="bg-[#1e293b] border border-gray-700 rounded-xl p-4 shadow-xl">
          <h2 className="text-4xl font-bold mb-10 text-center">Monthly Sales</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => `₹${value}`} />
              <Bar dataKey="total" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Weekly Sales */}
        <div className="bg-[#1e293b] border border-gray-700 rounded-xl p-4 shadow-xl">
          <h2 className="text-4xl font-bold mb-10 text-center">Weekly Sales (Last 4 Weeks)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={weeklyData || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week_starting" />
              <YAxis />
              <Tooltip formatter={(value) => `₹${value}`} />
              <Bar dataKey="total" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Daily Sales */}
        <div className="bg-[#1e293b] border border-gray-700 rounded-xl p-4 shadow-xl">
          <h2 className="text-4xl font-bold mb-10 text-center">Daily Sales (Last 7 Days)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dailyData || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip formatter={(value) => `₹${value}`} />
              <Bar dataKey="total" fill="#FFBB28" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Payment Breakdown */}
        <div className="bg-[#1e293b] border border-gray-700 rounded-xl p-4 shadow-xl">
          <h2 className="text-4xl font-bold mb-10 text-center">Payment Breakdown</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={paymentData || []}
                dataKey="total"
                nameKey="payment_method"
                outerRadius={100}
                label
              >
                {(paymentData || []).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `₹${value}`} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        

        <div className="bg-[#1e293b] border border-gray-700 rounded-xl p-4 shadow-xl">
        <h2 className="text-4xl font-bold mb-10 text-center">Weekly Expense Analysis (Last 4 Weeks)</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={weeklyExpenseData || []}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="week_starting" />
            <YAxis />
            <Tooltip formatter={(value) => `₹${value}`} />
            <Bar dataKey="total" fill="#FF4C4C" />
          </BarChart>
        </ResponsiveContainer>
      </div>


        <div className="bg-[#1e293b] border border-gray-700 rounded-xl p-4 shadow-xl">
          <h2 className="text-4xl font-bold mb-10 text-center">Expense Analysis (Last 7 Days)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={expenseData || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip formatter={(value) => `₹${value}`} />
              <Bar dataKey="total" fill="#FF4C4C" />
            </BarChart>
          </ResponsiveContainer>
        </div>


        {/* Top Products */}
        <div className="bg-[#1e293b] border border-gray-700 rounded-xl p-4 shadow-xl">
          <h2 className="text-4xl font-bold mb-10 text-center">Top Selling Products</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topProducts || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="product__name" />
              <YAxis />
              <Tooltip formatter={(value) => value} />
              <Bar dataKey="total_quantity" fill="#FF8042" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        {/* <img src="http://127.0.0.1:8000/api/ds/weekly-sales/" />
        <img src="http://127.0.0.1:8000/api/ds/correlation/" />
        <img src="http://127.0.0.1:8000/api/ds/forecast/" />
        <img src="http://127.0.0.1:8000/api/ds/sales-distribution/" /> */}
      </div>
    </div>
  )
}
