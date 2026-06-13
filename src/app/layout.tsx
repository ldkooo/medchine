export const metadata = {
  title: '智能贩卖机',
  description: '下一代智能贩卖机系统',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-[#0f172a] text-white antialiased">
        <nav className="glass-nav sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-xl shadow-lg shadow-blue-500/20">
                  🥤
                </div>
                <div>
                  <h1 className="text-lg font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">智能贩卖机</h1>
                  <p className="text-[10px] text-white/40 -mt-1">Vending Machine</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <NavLink href="/" icon="🛒" label="购买商品" />
                <NavLink href="/admin" icon="🔐" label="管理员" />
                <NavLink href="/reports" icon="📊" label="数据报表" />
              </div>
            </div>
          </div>
        </nav>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
      </body>
    </html>
  )
}

function NavLink({ href, icon, label }: { href: string; icon: string; label: string }) {
  return (
    <a
      href={href}
      className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-white/60 hover:text-white hover:bg-white/10 transition-all duration-200"
    >
      <span>{icon}</span>
      <span className="hidden sm:inline">{label}</span>
    </a>
  )
}
