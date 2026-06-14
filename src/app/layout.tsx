import './globals.css'

export const metadata = {
  title: '智能贩卖机',
  description: '智能贩卖机系统',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-gray-50 text-gray-900 pb-16">
        {/* 顶部紫色导航栏 */}
        <nav className="bg-purple-600 sticky top-0 z-50 shadow-md">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between h-14">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🥤</span>
                <span className="font-bold text-white text-lg">智能贩卖机</span>
              </div>
              <div className="flex items-center gap-4">
                <a href="/" className="text-white/80 hover:text-white text-sm font-medium">首页</a>
                <a href="/admin" className="text-white/80 hover:text-white text-sm font-medium">管理</a>
                <a href="/reports" className="text-white/80 hover:text-white text-sm font-medium">报表</a>
                <a href="/orders" className="text-white/80 hover:text-white text-sm font-medium">订单</a>
              </div>
            </div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto px-4 py-4">
          {children}
        </main>

        {/* 底部导航栏 */}
        <nav className="nav-bottom">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-around h-14">
              <NavItem href="/" icon="🏠" label="首页" />
              <NavItem href="/reports" icon="📊" label="报表" />
              <NavItem href="/orders" icon="📦" label="订单" />
              <NavItem href="/admin" icon="👤" label="我的" />
            </div>
          </div>
        </nav>
      </body>
    </html>
  )
}

function NavItem({ href, icon, label }: { href: string; icon: string; label: string }) {
  return (
    <a href={href} className="flex flex-col items-center gap-0.5 text-gray-400 hover:text-red-600 transition-colors">
      <span className="text-xl">{icon}</span>
      <span className="text-xs">{label}</span>
    </a>
  )
}
