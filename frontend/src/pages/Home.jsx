import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { productService, comboService } from '../services'
import { useChat } from '../store'
import { 
  Truck, 
  Shield, 
  Award, 
  Clock,
  CheckCircle,
  ArrowRight,
  Star,
  Package
} from 'lucide-react'

const Home = () => {
  const navigate = useNavigate()
  const { openChat } = useChat()
  const [featuredProducts, setFeaturedProducts] = useState([])
  const [featuredCombos, setFeaturedCombos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFeaturedProducts()
    fetchFeaturedCombos()
  }, [])

  const fetchFeaturedProducts = async () => {
    try {
      setLoading(true)
      const response = await productService.getAllProducts({
        skipCount: 0,
        maxResultCount: 8,
        sortBy: 'name',
        sortDirection: 'asc'
      })
      
      if (response?.success && response.result?.data) {
        setFeaturedProducts(response.result.data)
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchFeaturedCombos = async () => {
    try {
      const response = await comboService.getAllCombos({
        page: 0,
        size: 4,
        sort: 'createdAt',
        direction: 'DESC',
        available: true
      })
      
      if (response?.result?.content) {
        setFeaturedCombos(response.result.content)
      }
    } catch (error) {
      console.error('Error fetching combos:', error)
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)
  }

  const categories = [
    {
      name: 'Văn phòng phẩm',
      description: 'Bút, thước, kéo, dao rọc... đa dạng',
      icon: '✏️',
      link: '/categories/van-phong-pham',
      color: 'bg-blue-50 hover:bg-blue-100'
    },
    {
      name: 'Đồ dùng học sinh',
      description: 'Cặp sách, vở viết, dụng cụ học tập',
      icon: '🎒',
      link: '/categories/do-dung-hoc-sinh',
      color: 'bg-green-50 hover:bg-green-100'
    },
    {
      name: 'Sách giáo khoa',
      description: 'Sách giáo khoa các lớp, sách tham khảo',
      icon: '📚',
      link: '/categories/sach-giao-khoa',
      color: 'bg-purple-50 hover:bg-purple-100'
    }
  ]

  const reasons = [
    {
      icon: Award,
      title: 'Hàng chính hãng',
      description: 'Sản phẩm chính hãng, nguồn gốc rõ ràng',
      color: 'text-blue-600'
    },
    {
      icon: Shield,
      title: 'Giá cả hợp lý',
      description: 'Cam kết giá tốt nhất thị trường',
      color: 'text-green-600'
    },
    {
      icon: Truck,
      title: 'Giao hàng nhanh',
      description: 'Giao hàng trong từ 3-5 ngày làm việc',
      color: 'text-orange-600'
    },
    {
      icon: Clock,
      title: 'Đổi trả dễ dàng',
      description: 'Đổi trả trong 7 ngày nếu có lỗi',
      color: 'text-purple-600'
    }
  ]

  const orderSteps = [
    {
      step: '01',
      title: 'Chọn sản phẩm',
      description: 'Duyệt danh mục và chọn sản phẩm ưng ý'
    },
    {
      step: '02',
      title: 'Thêm vào giỏ',
      description: 'Thêm sản phẩm vào giỏ hàng'
    },
    {
      step: '03',
      title: 'Thanh toán',
      description: 'Điền thông tin và chọn phương thức thanh toán'
    },
    {
      step: '04',
      title: 'Nhận hàng',
      description: 'Giao hàng tận nơi, kiểm tra trước khi nhận'
    }
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-50 via-white to-purple-50 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Text Content */}
            <div className="space-y-6">
              <div className="inline-block px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                Văn phòng phẩm Quang Minh
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                Văn phòng phẩm
                <span className="block text-blue-600">Chất lượng - Giá tốt</span>
              </h1>
              <p className="text-lg md:text-xl text-gray-600 leading-relaxed">
                Cung cấp đầy đủ văn phòng phẩm, đồ dùng học sinh: bút viết, thước kẻ, cặp sách, vở viết, sách giáo khoa. 
                Sản phẩm đa dạng, chất lượng cao, giá cả hợp lý.
              </p>
              <div className="flex flex-wrap gap-4 pt-4">
                <button
                  onClick={() => navigate('/products')}
                  className="px-8 py-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center gap-2 group"
                >
                  Xem sản phẩm
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <button
                  onClick={openChat}
                  className="px-8 py-4 bg-white text-gray-900 border-2 border-gray-200 rounded-lg font-semibold hover:border-blue-600 hover:text-blue-600 transition-all duration-300"
                >
                  Liên hệ tư vấn
                </button>
              </div>
              
              {/* Stats */}
              <div className="grid grid-cols-3 gap-6 pt-8 border-t border-gray-200">
                <div>
                  <div className="text-3xl font-bold text-gray-900">500+</div>
                  <div className="text-sm text-gray-600">Sản phẩm</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-gray-900">98%</div>
                  <div className="text-sm text-gray-600">Hài lòng</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-gray-900">24/7</div>
                  <div className="text-sm text-gray-600">Hỗ trợ</div>
                </div>
              </div>
            </div>

            {/* Hero Image */}
            <div className="relative">
              <div className="aspect-square rounded-2xl overflow-hidden shadow-2xl">
                <img
                  src="/src/assets/website/library.jpg"
                  alt="Văn phòng phẩm chất lượng"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                    e.target.style.display = 'flex'
                    e.target.style.alignItems = 'center'
                    e.target.style.justifyContent = 'center'
                  }}
                />
              </div>
              {/* Floating badges */}
              <div className="absolute -top-4 -right-4 bg-white rounded-xl shadow-lg p-4 hidden md:block">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-6 h-6 text-green-500" />
                  <div>
                    <div className="text-sm font-semibold">Chất lượng</div>
                    <div className="text-xs text-gray-600">Đảm bảo</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Danh mục nổi bật
            </h2>
            <p className="text-lg text-gray-600">
              Đáp ứng mọi nhu cầu học tập và công việc
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {categories.map((category, index) => (
              <div
                key={index}
                onClick={() => navigate(category.link)}
                className={`${category.color} rounded-xl p-6 cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-105 group`}
              >
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">
                  {category.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {category.name}
                </h3>
                <p className="text-gray-600 text-sm">
                  {category.description}
                </p>
                <div className="mt-4 flex items-center text-blue-600 font-medium text-sm group-hover:gap-2 transition-all">
                  Xem thêm
                  <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Combos */}
      {featuredCombos.length > 0 && (
        <section className="py-20 bg-gradient-to-br from-orange-50 to-pink-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                🎁 Combo Ưu Đãi
              </h2>
              <p className="text-lg text-gray-600">
                Mua combo giá tốt hơn, tiết kiệm hơn khi mua lẻ
              </p>
            </div>

            <div className={`grid gap-6 ${
              featuredCombos.length === 1 ? 'grid-cols-1 max-w-md mx-auto' :
              featuredCombos.length === 2 ? 'grid-cols-1 sm:grid-cols-2 max-w-4xl mx-auto' :
              featuredCombos.length === 3 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' :
              'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
            }`}>
              {featuredCombos.map((combo) => (
                <div
                  key={combo.id}
                  className="bg-white rounded-xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden group cursor-pointer"
                  onClick={() => navigate('/combos')}
                >
                  {/* Image */}
                  <div className="relative aspect-square overflow-hidden bg-gray-100">
                    {combo.imageUrl ? (
                      <img
                        src={combo.imageUrl}
                        alt={combo.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-20 h-20 text-gray-300" />
                      </div>
                    )}
                    
                    {/* Discount Badge */}
                    <div className="absolute top-3 right-3 bg-gradient-to-r from-red-500 to-pink-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
                      -{combo.discountPercentage}%
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 min-h-[3rem] group-hover:text-blue-600 transition-colors">
                      {combo.name}
                    </h3>

                    {/* Products count */}
                    <div className="mb-3 text-sm text-gray-600">
                      <span className="font-medium">{combo.totalProducts} sản phẩm</span>
                    </div>

                    {/* Pricing */}
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm text-gray-500 line-through">
                          {formatCurrency(combo.totalOriginalPrice)}
                        </span>
                      </div>
                      <div className="text-2xl font-bold text-red-600">
                        {formatCurrency(combo.price)}
                      </div>
                      <div className="text-sm text-green-600 font-medium mt-1">
                        Tiết kiệm {formatCurrency(combo.discountAmount)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* View All Button */}
            <div className="text-center mt-10">
              <button
                onClick={() => navigate('/combos')}
                className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-lg hover:from-orange-600 hover:to-pink-600 transition-all shadow-lg hover:shadow-xl font-medium"
              >
                Xem tất cả combo
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Featured Products */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Sản phẩm bán chạy
            </h2>
            <p className="text-lg text-gray-600">
              Được khách hàng tin tưởng và lựa chọn
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-gray-100 rounded-xl h-96 animate-pulse"></div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts.slice(0, 8).map((product) => (
                <div
                  key={product.id}
                  onClick={() => navigate(`/products/${product.id}`)}
                  className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer group"
                >
                  {/* Product Image */}
                  <div className="relative aspect-square overflow-hidden bg-gray-100">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-purple-100">
                        <span className="text-4xl">📦</span>
                      </div>
                    )}
                    {product.stockQuantity < 10 && (
                      <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                        Sắp hết
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                      {product.name}
                    </h3>
                    
                    {/* Rating */}
                    <div className="flex items-center gap-1 mb-3">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className="w-4 h-4 text-gray-300"
                        />
                      ))}
                      <span className="text-xs text-gray-600 ml-1">(0 đánh giá)</span>
                    </div>

                    {/* Price */}
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xl font-bold text-blue-600">
                          {formatCurrency(product.price)}
                        </div>
                        <div className="text-xs text-gray-500">
                          Còn: {product.stockQuantity}
                        </div>
                      </div>
                      <button className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                        <ArrowRight className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="text-center mt-12">
            <button
              onClick={() => navigate('/products')}
              className="px-8 py-3 bg-gray-900 text-white rounded-lg font-semibold hover:bg-gray-800 transition-all duration-300 inline-flex items-center gap-2"
            >
              Xem tất cả sản phẩm
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Tại sao chọn chúng tôi?
            </h2>
            <p className="text-lg text-gray-600">
              Cam kết mang đến trải nghiệm mua sắm tốt nhất
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {reasons.map((reason, index) => (
              <div
                key={index}
                className="bg-white rounded-xl p-6 hover:shadow-lg transition-all duration-300"
              >
                <div className={`w-14 h-14 ${reason.color} bg-opacity-10 rounded-xl flex items-center justify-center mb-4`}>
                  <reason.icon className={`w-7 h-7 ${reason.color}`} />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {reason.title}
                </h3>
                <p className="text-gray-600">
                  {reason.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Order Process */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Quy trình đặt hàng đơn giản
            </h2>
            <p className="text-lg text-gray-600">
              Chỉ với 4 bước, sản phẩm sẽ đến tay bạn
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {orderSteps.map((step, index) => (
              <div key={index} className="relative">
                <div className="text-center relative z-10">
                  <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                    {step.step}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {step.title}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {step.description}
                  </p>
                </div>
                {index < orderSteps.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-full w-full h-0.5 bg-blue-200 -translate-x-1/2 z-0"></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Cần mua văn phòng phẩm?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Khám phá ngay bộ sưu tập đa dạng với giá ưu đãi
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <button
              onClick={() => navigate('/products')}
              className="px-8 py-4 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-100 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              Khám phá ngay
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Home