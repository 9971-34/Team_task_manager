import Sidebar from './Sidebar';
import Header from './Header';

const Layout = ({ children, darkMode, toggleDark }) => (
  <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
    <Sidebar darkMode={darkMode} toggleDark={toggleDark} />
    <div className="ml-[260px] flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 p-6 animate-[fadeIn_0.3s_ease-out]">{children}</main>
    </div>
  </div>
);

export default Layout;