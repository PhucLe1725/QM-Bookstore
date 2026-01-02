import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, ChevronDown } from 'lucide-react'
import { categoryService } from '../services'

/**
 * CategoryMenu Component
 * Hiển thị mega menu phân cấp vô hạn từ category tree
 * 
 * Features:
 * - Render cây phân cấp đệ quy
 * - Hover để show submenu
 * - Responsive design
 * - Always fetch fresh data (no cache)
 */
const CategoryMenu = ({ onCategorySelect, compact = false }) => {
  const [categoryTree, setCategoryTree] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [openMenuIds, setOpenMenuIds] = useState([]) // Changed to array for multiple levels
  const menuRef = useRef(null)

  useEffect(() => {
    loadCategoryTree()
  }, [])

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenMenuIds([])
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const loadCategoryTree = async () => {
    try {
      // Always fetch fresh data from API (no cache)
      const data = await categoryService.getCategoryTree()
      setCategoryTree(data)
      setLoading(false)
    } catch (err) {
      console.error('Failed to load category tree:', err)
      setError('Không thể tải danh mục')
      setLoading(false)
    }
  }

  const handleCategoryClick = (category) => {
    if (onCategorySelect) {
      onCategorySelect(category)
    }
    setOpenMenuIds([]) // Clear all open menus
  }

  const toggleMenu = (nodeId) => {
    setOpenMenuIds(prev => {
      if (prev.includes(nodeId)) {
        // Close this menu and all its children
        return prev.filter(id => id !== nodeId)
      } else {
        // Open this menu
        return [...prev, nodeId]
      }
    })
  }

  // Render recursive tree
  const renderCategoryNode = (node, level = 0) => {
    const hasChildren = node.children && node.children.length > 0
    const isOpen = openMenuIds.includes(node.id)

    if (compact) {
      // Compact mode: dropdown style
      return (
        <div key={node.id} style={{ paddingLeft: `${level * 16}px` }} className="relative">
          <div className="flex items-center justify-between py-2 px-3 hover:bg-gray-50 rounded cursor-pointer">
            <Link
              to={`/categories/${node.slug}`}
              className="flex-1 text-sm text-gray-700 hover:text-blue-600"
              onClick={() => handleCategoryClick(node)}
            >
              {node.name}
            </Link>
            {hasChildren && (
              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  toggleMenu(node.id)
                }}
                className="p-1 hover:bg-gray-200 rounded"
              >
                {isOpen ? (
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-500" />
                )}
              </button>
            )}
          </div>
          {hasChildren && isOpen && (
            <div className="ml-2 border-l-2 border-gray-200">
              {node.children.map(child => renderCategoryNode(child, level + 1))}
            </div>
          )}
        </div>
      )
    }

    // Full mode: mega menu style
    return (
      <div key={node.id} className="relative group">
        <Link
          to={`/categories/${node.slug}`}
          className="flex items-center justify-between px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
          onClick={() => handleCategoryClick(node)}
        >
          <span className="font-medium">{node.name}</span>
          {hasChildren && <ChevronRight className="w-4 h-4 ml-2" />}
        </Link>
        
        {hasChildren && (
          <div className="absolute left-full top-0 hidden group-hover:block bg-white shadow-lg rounded-lg border border-gray-200 min-w-[200px] z-50">
            <div className="py-2">
              {node.children.map(child => renderCategoryNode(child, level + 1))}
            </div>
          </div>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-red-600 text-sm py-4 text-center">
        {error}
      </div>
    )
  }

  if (!categoryTree || categoryTree.length === 0) {
    return (
      <div className="text-gray-500 text-sm py-4 text-center">
        <div>Chưa có danh mục nào</div>
        <div className="text-xs mt-1">
          {categoryTree === null ? '(null)' : '(empty array)'}
        </div>
      </div>
    )
  }

  return (
    <div ref={menuRef} className={compact ? 'w-full' : 'relative'}>
      {categoryTree.map(node => renderCategoryNode(node, 0))}
    </div>
  )
}

export default CategoryMenu
