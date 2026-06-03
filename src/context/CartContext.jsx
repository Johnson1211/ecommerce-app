import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useAuth } from './AuthContext'
import { supabase } from '../lib/supabase'

const CartContext = createContext(null)

export const CartProvider = ({ children }) => {
  const { user } = useAuth()
  const [cartItems, setCartItems] = useState([])
  const [loading, setLoading] = useState(false)

  // Load cart from localStorage (guest) or Supabase (logged in)
  useEffect(() => {
    if (user) {
      loadServerCart()
    } else {
      const saved = localStorage.getItem('guest_cart')
      if (saved) setCartItems(JSON.parse(saved))
    }
  }, [user])

  // Save to localStorage when guest
  useEffect(() => {
    if (!user) {
      localStorage.setItem('guest_cart', JSON.stringify(cartItems))
    }
  }, [cartItems, user])

  const loadServerCart = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('cart')
      .select(`*, product:products(*)`)
      .eq('user_id', user.id)

    if (!error && data) {
      setCartItems(data.map(item => ({
        id: item.product.id,
        name: item.product.name,
        price: item.product.price,
        image_url: item.product.image_url,
        quantity: item.quantity,
        category_id: item.product.category_id,
        file_url: item.product.file_url,
        metadata: item.product.metadata,
      })))
    }
    setLoading(false)
  }

  const addToCart = useCallback(async (product) => {
    if (user) {
      const { error } = await supabase
        .from('cart')
        .upsert({
          user_id: user.id,
          product_id: product.id,
          quantity: 1,
        }, { onConflict: 'user_id,product_id' })

      if (!error) await loadServerCart()
    } else {
      setCartItems(prev => {
        const existing = prev.find(item => item.id === product.id)
        if (existing) {
          return prev.map(item =>
            item.id === product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          )
        }
        return [...prev, { ...product, quantity: 1 }]
      })
    }
  }, [user])

  const removeFromCart = useCallback(async (productId) => {
    if (user) {
      await supabase.from('cart').delete().eq('user_id', user.id).eq('product_id', productId)
      await loadServerCart()
    } else {
      setCartItems(prev => prev.filter(item => item.id !== productId))
    }
  }, [user])

  const updateQuantity = useCallback(async (productId, quantity) => {
    if (quantity < 1) {
      removeFromCart(productId)
      return
    }

    if (user) {
      await supabase
        .from('cart')
        .update({ quantity })
        .eq('user_id', user.id)
        .eq('product_id', productId)
      await loadServerCart()
    } else {
      setCartItems(prev =>
        prev.map(item =>
          item.id === productId ? { ...item, quantity } : item
        )
      )
    }
  }, [user, removeFromCart])

  const clearCart = useCallback(async () => {
    if (user) {
      await supabase.from('cart').delete().eq('user_id', user.id)
    }
    setCartItems([])
    localStorage.removeItem('guest_cart')
  }, [user])

  const cartTotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0)

  const value = {
    cartItems,
    cartTotal,
    cartCount,
    loading,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
  }

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => {
  const context = useContext(CartContext)
  if (!context) throw new Error('useCart must be used within CartProvider')
  return context
}
