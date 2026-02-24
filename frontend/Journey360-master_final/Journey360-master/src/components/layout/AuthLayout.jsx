import heroImage from "../../assets/images/login-hero-new.png";

export default function AuthLayout({ children }) {
  // Force re-render check v2
  return (
    <div className="h-[calc(100vh-4rem)] flex overflow-hidden key-layout-v2">

      {/* Left Image Section - Full Height */}
      <div className="hidden lg:flex w-1/2 relative bg-gray-900 h-full">
        <img
          src={heroImage}
          alt="Travel"
          className="absolute inset-0 h-full w-full object-cover opacity-90"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

        <div className="relative z-10 w-full h-full p-16 flex flex-col justify-end">
          <h1 className="text-5xl font-bold leading-tight text-white mb-6">
            Your journey, perfected <br /> by AI.
          </h1>
          <p className="max-w-xl text-lg text-gray-200 leading-relaxed">
            Join thousands of travelers using Journey360 to navigate the world
            with real-time safety insights and personalized AI itineraries.
          </p>
        </div>
      </div>

      {/* Right Form Section - Internal Footer flow */}
      <div className="w-full lg:w-1/2 flex flex-col bg-gray-50 h-full relative">

        {/* Main Content Area - Centered */}
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="w-full max-w-md">
            {children}
          </div>
        </div>

        {/* Footer - Stays at bottom */}
        <footer className="w-full py-6 px-8 border-t border-gray-100 bg-white/50 backdrop-blur-sm">
          <div className="flex flex-col md:flex-row justify-between items-center text-xs text-gray-500 gap-3 max-w-lg mx-auto md:max-w-none">
            <span className="font-medium">© 2024 Journey360 AI. All rights reserved.</span>
            <div className="flex items-center gap-6 font-medium">
              <a href="#" className="hover:text-blue-600 transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-blue-600 transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-blue-600 transition-colors">Help Center</a>
            </div>
          </div>
        </footer>
      </div>

    </div>
  );
}
