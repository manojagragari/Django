"use client"
import { useEffect, useState } from "react"
import DarkToggle from "@/components/DarkToggle"
import { authFetch } from "@/lib/authFetch";
import { useRouter } from "next/navigation";


import Link from "next/link";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000"

export default function ProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [dashboard, setDashboard] = useState(null)
  const [error, setError] = useState("")

  const [search, setSearch] = useState("")
  const [filterCategory, setFilterCategory] = useState("")

  const [name, setName] = useState("")
  const [categoryId, setCategoryId] = useState("")
  const [purchasePrice, setPurchasePrice] = useState("")
  const [sellingPrice, setSellingPrice] = useState("")
  const [stock, setStock] = useState("")

  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName] = useState("")
  const [editCategoryId, setEditCategoryId] = useState("")
  const [editPurchasePrice, setEditPurchasePrice] = useState("")
  const [editSellingPrice, setEditSellingPrice] = useState("")
  const [editStock, setEditStock] = useState("")

  const [newCategoryName, setNewCategoryName] = useState("")
  const [showCategoryForm, setShowCategoryForm] = useState(false)
  
  const [expenseTitle, setExpenseTitle] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseCategory, setExpenseCategory] = useState("");

  
const [saleProductId, setSaleProductId] = useState("")
const [saleQuantity, setSaleQuantity] = useState("")
const [discount, setDiscount] = useState("")
const [taxPercent, setTaxPercent] = useState("")
const [paymentMethod, setPaymentMethod] = useState("CASH")
const [customerName, setCustomerName] = useState("")

const [lastInvoice, setLastInvoice] = useState(null)

const [sales, setSales] = useState([])

useEffect(() => {
  const token = localStorage.getItem("access_token");

  if (!token) {
    router.push("/login");
  }
}, []);

 const startEdit = (product) => {
  setEditingId(product.id)
  setEditName(product.name)
  setEditCategoryId(product.category)
  setEditPurchasePrice(product.purchase_price)
  setEditSellingPrice(product.selling_price)
  setEditStock(product.stock)
}
const selectedProduct = products.find(
    (p) => p.id === Number(saleProductId)
  );

  /* ---------------- FETCH DATA ---------------- */

  const fetchSales = async () => {
  try {
    const res = await authFetch(`${API_BASE}/api/sales/`,{},router);

    if (!res || !res.ok) throw new Error("Failed to fetch sales");

    const data = await res.json();
    setSales(data);
  } catch (err) {
    setError(err.message);
  }
};



  const fetchDashboard = async () => {
  try {
    const res = await authFetch(`${API_BASE}/api/dashboard/`,{},router);

    if (!res || !res.ok) throw new Error("Failed to fetch dashboard data");

    const data = await res.json();
    setDashboard(data);
  } catch (err) {
    setError(err.message);
  }
};


  const fetchProducts = async () => {
  try {
    const res = await authFetch(`${API_BASE}/api/products/`,{},router);

    if (!res || !res.ok) throw new Error("Failed to fetch products");

    const data = await res.json();
    setProducts(data);
  } catch (err) {
    setError(err.message);
  }
};

  const fetchCategories = async () => {
  try {
    const res = await authFetch(`${API_BASE}/api/categories/`,{},router);

    if (!res || !res.ok) throw new Error("Failed to fetch categories");

    const data = await res.json();
    setCategories(data);
  } catch (err) {
    setError(err.message);
  }
};

  useEffect(() => {
    fetchDashboard()
    fetchProducts()
    fetchCategories()
    fetchSales() 
  }, [router])

  const handleExpenseSubmit = async (e) => {
  e.preventDefault();

  try {
    const res = await authFetch(
      `${API_BASE}/api/expenses/`,
      {
        method: "POST",
        body: JSON.stringify({
          title: expenseTitle,
          amount: Number(expenseAmount),
          category: expenseCategory,
        }),
      },
      router
    );

    if (!res || !res.ok) throw new Error("Failed to add expense");

    // Reset form
    setExpenseTitle("");
    setExpenseAmount("");
    setExpenseCategory("");

    await fetchDashboard(); // update profit
  } catch (err) {
    setError(err.message);
  }
};


    /* ---------------- SALE ---------------- */
const handleSaleSubmit = async (e) => {
  e.preventDefault();
  const selectedProduct = products.find(
  (p) => p.id === Number(saleProductId)
);

if (!selectedProduct) return;

if (Number(saleQuantity) > selectedProduct.stock) {
  alert(`Only ${selectedProduct.stock} items in stock`);
  return;
}

  try {
    const res = await authFetch(
      `${API_BASE}/api/sales/`,
      {
        method: "POST",
        body: JSON.stringify({
          product: Number(saleProductId),
          quantity: Number(saleQuantity),
          discount: Number(discount || 0),
          tax_percent: Number(taxPercent || 0),
          payment_method: paymentMethod,
          customer_name: customerName,
        }),
      },
      router
    );

    if (!res || !res.ok) throw new Error("Failed to add sale");

    setSaleProductId("");
    setSaleQuantity("");
    setDiscount("");
    setTaxPercent("");
    setCustomerName("");

    await fetchSales();
    await fetchDashboard();
    await fetchProducts(); // update stock automatically
  } catch (err) {
    setError(err.message);
  }
};




  /* ---------------- PRODUCT CRUD ---------------- */

  const handleSubmit = async (e) => {
  e.preventDefault();

  try {
    const res = await authFetch(
      `${API_BASE}/api/products/`,
      {
        method: "POST",
        body: JSON.stringify({
          name,
          category: Number(categoryId),
          purchase_price: Number(purchasePrice),
          selling_price: Number(sellingPrice),
          stock: Number(stock),
        }),
      },
      router
    );

    if (!res || !res.ok) throw new Error("Failed to add product");

      // ✅ RESET FORM PROPERLY
    setName("");
    setCategoryId("");
    setPurchasePrice("");
    setSellingPrice("");
    setStock("");


    await fetchProducts();
  } catch (err) {
    setError(err.message);
  }
};


  const cancelEdit = () => {
  setEditingId(null)
  setEditName("")
  setEditCategoryId("")
  setEditPurchasePrice("")
  setEditSellingPrice("")
  setEditStock("")
}

  const handleUpdate = async (id) => {
  try {
    const res = await authFetch(
      `${API_BASE}/api/products/${id}/`,
      {
        method: "PUT",
        body: JSON.stringify({
          name: editName,
          category: Number(editCategoryId),
          purchase_price: Number(editPurchasePrice),
          selling_price: Number(editSellingPrice),
          stock: Number(editStock),
        }),
      },
      router
    );

    if (!res || !res.ok) throw new Error("Failed to update product");

    cancelEdit();
    await fetchProducts();
  } catch (err) {
    setError(err.message);
  }
};

  // Delete product
  const handleDelete = async (id) => {
  try {
    const res = await authFetch(
      `${API_BASE}/api/products/${id}/`,
      {
        method: "DELETE",
      },
      router
    );

    if (!res || !res.ok) throw new Error("Failed to delete product");

    await fetchProducts();
  } catch (err) {
    setError(err.message);
  }
};


  /* ---------------- CATEGORY ---------------- */

  const handleAddCategory = async () => {
  try {
    const res = await authFetch(
      `${API_BASE}/api/categories/`,
      {
        method: "POST",
        body: JSON.stringify({
          name: newCategoryName,
        }),
      },
      router
    );

    if (!res || !res.ok) throw new Error("Failed to add category");

    setNewCategoryName("");
    setShowCategoryForm(false);
    await fetchCategories();
  } catch (err) {
    setError(err.message);
  }
};



  /* ---------------- FILTER ---------------- */

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) &&
      (filterCategory ? p.category === Number(filterCategory) : true)
  )

  if (!dashboard) {
    return <h1 className="p-6">Loading...</h1>
  }

  return (
    <div className="p-4 sm:p-6 lg:p-10 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 min-h-screen max-w-7xl mx-auto transition-colors">
      {error && <p className="text-red-600 mb-4">{error}</p>}

      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-center gap-4 mb-6">
      <div className="flex justify-between items-center mb-4">
        <DarkToggle />
         <Link
          href="/analytics"
          className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
        >
          Go to Analysis
        </Link>
      </div>
        <h1 className="text-3xl font-bold">Product Management</h1>

        <div>
          <button
            onClick={() => setShowCategoryForm(!showCategoryForm)}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition"
          >
            Add New Category
          </button>

          {showCategoryForm && (
            <div className="mt-3 flex gap-2">
              <input
                className="border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-2 rounded text-gray-800 dark:text-gray-100"
                placeholder="Category Name"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
              />
              <button
                onClick={handleAddCategory}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition"
              >
                Save
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Dashboard Section */}

  {/* Cards */}
 <div className="p-4 rounded-xl shadow-md bg-white dark:bg-gray-800 transition-colors mb-6">
  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-5 gap-4">
    <Card title="Total Sales" value={`₹ ${dashboard.total_sales}`} />
    <Card title="Total Expenses" value={`₹ ${dashboard.total_expenses}`} />
    <Card title="Net Profit" value={`₹ ${dashboard.net_profit}`} />
    <Card title="Total Products" value={dashboard.total_products} />
  

  {/* Search */}
  <div className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-xl p-4 transition-colors">
    <h2 className="font-semibold mb-3">
      Search Category Wise Analysis
    </h2>

    <div className="flex flex-col sm:flex-col gap-4">
      <input
        className="border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-lg p-2 w-full sm:w-auto text-gray-800 dark:text-gray-100"
        placeholder="Search Product"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <select
        className="border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-lg p-2 w-full sm:w-auto text-gray-800 dark:text-gray-100"
        value={filterCategory}
        onChange={(e) => setFilterCategory(e.target.value)}
      >
        <option value="">All Categories</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      </div>
    </div>
  </div>

</div>


      {/* Add Product */}
     {/* BOTH FORMS */}
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">

  {/* STOCK FORM */}
  <form
    onSubmit={handleSubmit}
    className="border border-gray-200 dark:border-gray-700 p-5 rounded-xl shadow-md bg-white dark:bg-gray-800 grid grid-cols-1 sm:grid-cols-2 gap-3 transition-colors"
  >
    <h2 className="sm:col-span-2 font-semibold text-lg">
      Add Stock
    </h2>

    <input required className="border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 p-2 rounded text-gray-800 dark:text-gray-100"
      placeholder="Name"
      value={name}
      onChange={(e)=>setName(e.target.value)} />

    <select required className="border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 p-2 rounded text-gray-800 dark:text-gray-100"
      value={categoryId}
      onChange={(e)=>setCategoryId(e.target.value)}>
      <option value="">Category</option>
      {categories.map(c=>(
        <option key={c.id} value={c.id}>{c.name}</option>
      ))}
    </select>

    <input required type="number" className="border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 p-2 rounded text-gray-800 dark:text-gray-100"
      placeholder="Purchase"
      value={purchasePrice}
      onChange={(e)=>setPurchasePrice(e.target.value)} />

    <input required type="number" className="border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 p-2 rounded text-gray-800 dark:text-gray-100"
      placeholder="Selling"
      value={sellingPrice}
      onChange={(e)=>setSellingPrice(e.target.value)} />

    <input required type="number" className="border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 p-2 rounded text-gray-800 dark:text-gray-100"
      placeholder="Stock"
      value={stock}
      onChange={(e)=>setStock(e.target.value)} />

    <button className="bg-gray-900 hover:bg-black dark:bg-gray-100 dark:text-black py-2 rounded-lg sm:col-span-2 transition">
      Add
    </button>
  </form>


  {/* SALE FORM */}
  {/* SALE FORM */}
<form
  onSubmit={handleSaleSubmit}
  className="border border-gray-200 dark:border-gray-700 p-5 rounded-xl shadow-md bg-white dark:bg-gray-800 grid grid-cols-1 sm:grid-cols-2 gap-3 transition-colors"
>
  <h2 className="sm:col-span-2 font-semibold text-lg">
    Create Sale
  </h2>

  <select
    required
    className="border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 p-2 rounded text-gray-800 dark:text-gray-100"
    value={saleProductId}
    onChange={(e)=>setSaleProductId(e.target.value)}
  >
    <option value="">Select Product</option>
    {products.map((p)=>(
      <option key={p.id} value={p.id}>{p.name}</option>
    ))}
  </select>

  <input
    required
    type="number"
    className="border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 p-2 rounded text-gray-800 dark:text-gray-100"
    placeholder="Quantity"
    value={saleQuantity}
    onChange={(e)=>setSaleQuantity(e.target.value)}
  />

  <input
    type="number"
    className="border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 p-2 rounded text-gray-800 dark:text-gray-100"
    placeholder="Discount"
    value={discount}
    onChange={(e)=>setDiscount(e.target.value)}
  />

  <input
    type="number"
    className="border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 p-2 rounded text-gray-800 dark:text-gray-100"
    placeholder="Tax %"
    value={taxPercent}
    onChange={(e)=>setTaxPercent(e.target.value)}
  />

  <select
    className="border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 p-2 rounded text-gray-800 dark:text-gray-100"
    value={paymentMethod}
    onChange={(e)=>setPaymentMethod(e.target.value)}
  >
    <option value="CASH">Cash</option>
    <option value="UPI">UPI</option>
    <option value="CARD">Card</option>
  </select>

  <input
    type="text"
    className="border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 p-2 rounded text-gray-800 dark:text-gray-100"
    placeholder="Customer Name (Optional)"
    value={customerName}
    onChange={(e)=>setCustomerName(e.target.value)}
  />
  <button
  
  disabled={
    !selectedProduct ||
    Number(saleQuantity) <= 0 ||
    Number(saleQuantity) > selectedProduct.stock
  }
  className={`py-2 rounded-lg sm:col-span-2 transition ${
    !selectedProduct ||
    Number(saleQuantity) <= 0 ||
    Number(saleQuantity) > selectedProduct.stock
      ? "bg-gray-500 cursor-not-allowed"
      : "bg-green-600 hover:bg-green-700 text-white"
  }`}
>
  Create Sale
</button>
  
</form>
<form
  onSubmit={handleExpenseSubmit}
  className="border border-gray-200 dark:border-gray-700 p-5 rounded-xl shadow-md bg-white dark:bg-gray-800 grid grid-cols-1 sm:grid-cols-2 gap-3 transition-colors"
>
  <h2 className="sm:col-span-2 font-semibold text-lg">
    Add Expense
  </h2>

  <input
    required
    className="border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 p-2 rounded text-gray-800 dark:text-gray-100"
    placeholder="Expense Title"
    value={expenseTitle}
    onChange={(e)=>setExpenseTitle(e.target.value)}
  />

  <input
    required
    type="number"
    className="border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 p-2 rounded text-gray-800 dark:text-gray-100"
    placeholder="Amount"
    value={expenseAmount}
    onChange={(e)=>setExpenseAmount(e.target.value)}
  />

  <input
    className="border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 p-2 rounded text-gray-800 dark:text-gray-100"
    placeholder="Category"
    value={expenseCategory}
    onChange={(e)=>setExpenseCategory(e.target.value)}
  />

  <button className="bg-red-600 text-white py-2 rounded sm:col-span-2">
    Add Expense
  </button>
</form>

  


</div>


        <div className="overflow-x-auto">
        <h2 className="text-2xl font-bold mb-4">Inventory data</h2>
    <table className="min-w-full border border-gray-200 dark:border-gray-700 text-center bg-white dark:bg-gray-800 transition-colors">
  <thead>
    <tr>
      <th className="border border-gray-200 dark:border-gray-700 p-2">Name</th>
      <th className="border border-gray-200 dark:border-gray-700 p-2">Category</th>
      <th className="border border-gray-200 dark:border-gray-700 p-2">Purchase</th>
      <th className="border border-gray-200 dark:border-gray-700 p-2">Selling</th>
      <th className="border border-gray-200 dark:border-gray-700 p-2">Profit</th>
      <th className="border border-gray-200 dark:border-gray-700 p-2">Margin %</th>
      <th className="border border-gray-200 dark:border-gray-700 p-2">Stock</th>
      <th className="border border-gray-200 dark:border-gray-700 p-2">Actions</th>
      <th className="border border-gray-200 dark:border-gray-700 p-2">Strict Actions</th>
    </tr>
  </thead>

  <tbody>
    {filteredProducts.map((p) => {
      const purchase = editingId === p.id ? Number(editPurchasePrice) : p.purchase_price
      const selling = editingId === p.id ? Number(editSellingPrice) : p.selling_price

      const profit = selling - purchase
      const margin = purchase ? ((profit / purchase) * 100).toFixed(1) : 0

      return (
        <tr key={p.id}>
          {/* NAME */}
          <td className="border border-gray-200 dark:border-gray-700 p-2">
            {editingId === p.id ? (
              <input
                className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 p-1 w-full text-gray-800 dark:text-gray-100"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            ) : (
              p.name
            )}
          </td>

          {/* CATEGORY */}
          <td className="border border-gray-200 dark:border-gray-700 p-2">
            {editingId === p.id ? (
              <select
                className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 p-1 w-full text-gray-800 dark:text-gray-100"
                value={editCategoryId}
                onChange={(e) => setEditCategoryId(e.target.value)}
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            ) : (
              p.category_name || p.category
            )}
          </td>

          {/* PURCHASE */}
          <td className="border border-gray-200 dark:border-gray-700 p-2">
            {editingId === p.id ? (
              <input
                type="number"
                className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 p-1 w-full text-gray-800 dark:text-gray-100"
                value={editPurchasePrice}
                onChange={(e) => setEditPurchasePrice(e.target.value)}
              />
            ) : (
              `₹ ${p.purchase_price}`
            )}
          </td>

          {/* SELLING */}
          <td className="border border-gray-200 dark:border-gray-700 p-2">
            {editingId === p.id ? (
              <input
                type="number"
                className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 p-1 w-full text-gray-800 dark:text-gray-100"
                value={editSellingPrice}
                onChange={(e) => setEditSellingPrice(e.target.value)}
              />
            ) : (
              `₹ ${p.selling_price}`
            )}
          </td>

          {/* PROFIT */}
          <td className="border border-gray-200 dark:border-gray-700 p-2">₹ {profit}</td>

          {/* MARGIN */}
          <td className="border border-gray-200 dark:border-gray-700 p-2">{margin}%</td>

          {/* STOCK */}
          <td className="border border-gray-200 dark:border-gray-700 p-2">
            {editingId === p.id ? (
              <input
                type="number"
                className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 p-1 w-full text-gray-800 dark:text-gray-100"
                value={editStock}
                onChange={(e) => setEditStock(e.target.value)}
              />
            ) : (
              <span className={p.stock < 5 ? "text-red-600 font-bold" : ""}>
                {p.stock}
              </span>
            )}
          </td>

          {/* ACTIONS */}
          <td className="border border-gray-200 dark:border-gray-700 p-2">
            {editingId === p.id ? (
              <button
                className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded transition"
                onClick={cancelEdit}
              >
                Cancel
              </button>
            ) : (
              <button
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded transition"
                onClick={() => startEdit(p)}
              >
                Edit
              </button>
            )}
          </td>

          {/* STRICT ACTIONS */}
          <td className="border border-gray-200 dark:border-gray-700 p-2">
            {editingId === p.id ? (
              <button
                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded transition"
                onClick={() => handleUpdate(p.id)}
              >
                Save
              </button>
            ) : (
              <button
                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded transition"
                onClick={() => handleDelete(p.id)}
              >
                Delete
              </button>
            )}
          </td>
        </tr>
      )
    })}
  </tbody>
</table>
</div>
{/* ---------------- SALES HISTORY ---------------- */}

<div className="mt-10">
  <h2 className="text-2xl font-bold mb-4">Sales History</h2>

  <div className="overflow-x-auto">
    <table className="min-w-full border border-gray-200 dark:border-gray-700 text-center bg-white dark:bg-gray-800 transition-colors">
      <thead>
        <tr>
          <th className="border border-gray-200 dark:border-gray-700 p-2">Invoice</th>
          <th className="border border-gray-200 dark:border-gray-700 p-2">Product</th>
          <th className="border border-gray-200 dark:border-gray-700 p-2">Qty</th>
          <th className="border border-gray-200 dark:border-gray-700 p-2">Discount</th>
          <th className="border border-gray-200 dark:border-gray-700 p-2">Tax %</th>
          <th className="border border-gray-200 dark:border-gray-700 p-2">Total</th>
          <th className="border border-gray-200 dark:border-gray-700 p-2">Payment</th>
          <th className="border border-gray-200 dark:border-gray-700 p-2">Customer</th>
          <th className="border border-gray-200 dark:border-gray-700 p-2">Date</th>
        </tr>
      </thead>

      <tbody>
        {sales.map((sale) => (
          <tr key={sale.id}>
            <td className="border border-gray-200 dark:border-gray-700 p-2">{sale.invoice_number}</td>
            <td className="border border-gray-200 dark:border-gray-700 p-2">{sale.product_name || sale.product}</td>
            <td className="border border-gray-200 dark:border-gray-700 p-2">{sale.quantity}</td>
            <td className="border border-gray-200 dark:border-gray-700 p-2">{sale.discount}</td>
            <td className="border border-gray-200 dark:border-gray-700 p-2">{sale.tax_percent}</td>
            <td className="border border-gray-200 dark:border-gray-700 p-2">₹ {sale.total_amount}</td>
            <td className="border border-gray-200 dark:border-gray-700 p-2">{sale.payment_method}</td>
            <td className="border border-gray-200 dark:border-gray-700 p-2">{sale.customer_name || "-"}</td>
            <td className="border border-gray-200 dark:border-gray-700 p-2">
              {new Date(sale.sale_date).toLocaleString()}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</div>


    </div>
  )
}

/* ---------------- CARD ---------------- */

const Card = ({ title, value }) => (
  <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 sm:p-4 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 shadow-sm transition-colors">
    <h3 className="text-xs sm:text-sm font-medium">{title}</h3>
    <p className="text-lg sm:text-xl font-bold mt-1">{value}</p>
  </div>
)

