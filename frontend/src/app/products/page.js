"use client"
import { useEffect, useState } from "react"

export default function ProductsPage() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])

  // Form states for adding a product
  const [name, setName] = useState("")
  const [categoryId, setCategoryId] = useState("")
  const [purchasePrice, setPurchasePrice] = useState("")
  const [sellingPrice, setSellingPrice] = useState("")
  const [stock, setStock] = useState("")

  // States for editing a product
  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName] = useState("")
  const [editCategoryId, setEditCategoryId] = useState("")
  const [editPurchasePrice, setEditPurchasePrice] = useState("")
  const [editSellingPrice, setEditSellingPrice] = useState("")
  const [editStock, setEditStock] = useState("")

  // Fetch products
  const fetchProducts = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/api/products/")
      const data = await res.json()
      setProducts(data)
    } catch (err) {
      console.error("Error fetching products:", err)
    }
  }

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/api/categories/")
      const data = await res.json()
      setCategories(data)
    } catch (err) {
      console.error("Error fetching categories:", err)
    }
  }
  //Add category
  const [newCategoryName, setNewCategoryName] = useState("")
  const [showCategoryForm, setShowCategoryForm] = useState(false)
  
  //Add category function
  const handleAddCategory = async () => {
  if (!newCategoryName.trim()) {
    alert("Category name cannot be empty")
    return
  }

  try {
    const response = await fetch("http://127.0.0.1:8000/api/categories/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newCategoryName.trim()
      })
    })

    const data = await response.json()
    console.log("Server response:", data)   // 👈 ADD THIS

    if (!response.ok) {
      throw new Error(JSON.stringify(data))
    }

    fetchCategories()
    setNewCategoryName("")
    setShowCategoryForm(false)
    alert("Category added successfully!")

  } catch (error) {
    console.error("Error:", error)
    alert("Error adding category:\n" + error.message)
  }
}


  useEffect(() => {
    fetchProducts()
    fetchCategories()
  }, [])

  // Add Product
  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          category: Number(categoryId),
          purchase_price: Number(purchasePrice),
          selling_price: Number(sellingPrice),
          stock: Number(stock)
        })
      })

      if (!response.ok) {
        let errorMessage = ""
        try {
          const errorData = await response.json()
          errorMessage = JSON.stringify(errorData)
        } catch {
          errorMessage = await response.text()
        }
        throw new Error(`Failed to add product. Status ${response.status}: ${errorMessage}`)
      }

      await response.json()
      fetchProducts()
      setName("")
      setCategoryId("")
      setPurchasePrice("")
      setSellingPrice("")
      setStock("")
      alert("Product added successfully!")
    } catch (error) {
      console.error("Error adding product:", error)
      alert(`Error adding product:\n${error.message}`)
    }
  }

  // Start editing
  const startEdit = (product) => {
    setEditingId(product.id)
    setEditName(product.name)
    setEditCategoryId(product.category) // category ID
    setEditPurchasePrice(product.purchase_price)
    setEditSellingPrice(product.selling_price)
    setEditStock(product.stock)
  }

  // Cancel editing
  const cancelEdit = () => {
    setEditingId(null)
    setEditName("")
    setEditCategoryId("")
    setEditPurchasePrice("")
    setEditSellingPrice("")
    setEditStock("")
  }

  // Update product
  const handleUpdate = async (id) => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/products/${id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName.trim(),
          category: Number(editCategoryId),
          purchase_price: Number(editPurchasePrice),
          selling_price: Number(editSellingPrice),
          stock: Number(editStock)
        })
      })

      if (!response.ok) {
        let errorMessage = ""
        try {
          const errorData = await response.json()
          errorMessage = JSON.stringify(errorData)
        } catch {
          errorMessage = await response.text()
        }
        throw new Error(`Failed to update product. Status ${response.status}: ${errorMessage}`)
      }

      await response.json()
      fetchProducts()
      cancelEdit()
      alert("Product updated successfully!")
    } catch (error) {
      console.error("Error updating product:", error)
      alert(`Error updating product:\n${error.message}`)
    }
  }

  // Delete product
  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this product?")) return
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/products/${id}/`, {
        method: "DELETE"
      })

      if (!response.ok) {
        throw new Error(`Failed to delete product. Status ${response.status}`)
      }

      fetchProducts()
      alert("Product deleted successfully!")
    } catch (error) {
      console.error("Error deleting product:", error)
      alert(`Error deleting product:\n${error.message}`)
    }
  }

  return (
    <div className="p-6 bg-white min-h-screen">
      <div className="flex flex-row justify-between items-center">
      <h1 className="text-4xl font-bold">Product Management</h1>
      {/* Add Category Section */}
        <div className="mt-4 ">
          <button
            onClick={() => setShowCategoryForm(!showCategoryForm)}
            className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
          >
            Add New Category
          </button>

          {showCategoryForm && (
            <div className="mt-3 flex gap-2">
              <input
                type="text"
                placeholder="Category Name"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="border p-2"
              />
              <button
                onClick={handleAddCategory}
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
              >
                Save
              </button>
            </div>
          )}
        </div>

      </div>
      {/* Add Product Form */}
      <form onSubmit={handleSubmit} className="mt-6 flex gap-4 flex-wrap">
        <input
          type="text"
          placeholder="Product Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="border p-2"
          required
        />

        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="border p-2"
          required
        >
          <option value="">Select Category</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>

        <input
          type="number"
          placeholder="Purchase Price"
          value={purchasePrice}
          onChange={(e) => setPurchasePrice(e.target.value)}
          className="border p-2"
          required
        />

        <input
          type="number"
          placeholder="Selling Price"
          value={sellingPrice}
          onChange={(e) => setSellingPrice(e.target.value)}
          className="border p-2"
          required
        />

        <input
          type="number"
          placeholder="Stock"
          value={stock}
          onChange={(e) => setStock(e.target.value)}
          className="border p-2"
          required
        />

        <button type="submit" className="bg-white text-black px-4 py-2 rounded rounded-[10] border border-gray-200 hover:bg-gray-200">Add Product</button>
      </form>

      {/* Product Table */}
      <table className="border border-black mt-6 w-full text-center">
        <thead>
          <tr>
            <th className="border p-2">ID</th>
            <th className="border p-2">Name</th>
            <th className="border p-2">Category</th>
            <th className="border p-2">Purchase Price</th>
            <th className="border p-2">Selling Price</th>
            <th className="border p-2">Stock</th>
            <th className="border p-2">Actions</th>
            <th className="border p-2">Strict Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map(product => (
            <tr key={product.id}>
              <td className="border p-2">{product.id}</td>

              {/* Editable fields */}
              <td className="border p-2">
                {editingId === product.id ? (
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="border p-1"
                  />
                ) : product.name}
              </td>

              <td className="border p-2">
                {editingId === product.id ? (
                  <select
                    value={editCategoryId}
                    onChange={(e) => setEditCategoryId(e.target.value)}
                    className="border p-1"
                  >
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                ) : product.category_name || product.category} 
                {/* Use category_name if your API returns it */}
              </td>

              <td className="border p-2">
                {editingId === product.id ? (
                  <input
                    type="number"
                    value={editPurchasePrice}
                    onChange={(e) => setEditPurchasePrice(e.target.value)}
                    className="border p-1"
                  />
                ) : `₹ ${product.purchase_price}`}
              </td>

              <td className="border p-2">
                {editingId === product.id ? (
                  <input
                    type="number"
                    value={editSellingPrice}
                    onChange={(e) => setEditSellingPrice(e.target.value)}
                    className="border p-1"
                  />
                ) : `₹ ${product.selling_price}`}
              </td>

              <td className="border p-2">
                {editingId === product.id ? (
                  <input
                    type="number"
                    value={editStock}
                    onChange={(e) => setEditStock(e.target.value)}
                    className="border p-1"
                  />
                ) : product.stock}
              </td>

              <td className="border p-2">
                {editingId === product.id ? (
                  <>
                    <button
                      className="bg-gray-400 text-white px-2 py-1"
                      onClick={cancelEdit}
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      className="bg-blue-500 text-white px-2 py-1"
                      onClick={() => startEdit(product)}
                    >
                      Edit
                    </button>
                  </>
                )}
              </td>
              <td className="border p-2">
                {editingId === product.id ? (
                  <>
                    <button
                      className="bg-green-500 text-white px-2 py-1"
                      onClick={() => handleUpdate(product.id)}
                    >
                      Save
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      className="bg-red-500 text-white px-2 py-1"
                      onClick={() => handleDelete(product.id)}
                    >
                      Delete
                    </button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
