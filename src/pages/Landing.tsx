import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Landing() {
  const navigate = useNavigate();
  const { session } = useAuth();

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
      {/* Background Image with Overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-fixed z-0"
        style={{ backgroundImage: 'url("/static/images/background.jpg")' }}
      >
        <div className="absolute inset-0 bg-black/70 bg-blend-overlay"></div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Hero Section */}
        <section className="py-20 relative overflow-hidden">
          <div className="container mx-auto px-4 text-center max-w-4xl relative">
            {/* Floating Cards */}
            <div className="absolute -right-20 top-0 w-64 h-96 transform rotate-12 opacity-60 animate-float-slow pointer-events-none">
              <img src="/static/ygo/pics/10000020.jpg" alt="Example Card 1" className="w-full h-full object-cover rounded-lg shadow-2xl" />
            </div>
            <div className="absolute -left-16 top-20 w-64 h-96 transform -rotate-12 opacity-60 animate-float pointer-events-none">
              <img src="/static/ygo/pics/10000021.jpg" alt="Example Card 2" className="w-full h-full object-cover rounded-lg shadow-2xl" />
            </div>
            <h1 className="mb-4 text-5xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 animate-fade-in">
              Create Your Own Yu-Gi-Oh! Cards
            </h1>
            <p className="mb-8 text-xl md:text-2xl text-gray-300">
              Design and customize Yu-Gi-Oh! cards with our easy-to-use card maker
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              {session ? (
                <button
                  onClick={() => navigate('/create')}
                  className="px-6 py-3 md:px-8 md:py-4 text-lg font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-full shadow-lg hover:shadow-blue-500/50 transform hover:-translate-y-1 transition-all duration-200"
                >
                  Start Creating
                </button>
              ) : (
                <>
                  <button
                    onClick={() => navigate('/auth')}
                    className="px-6 py-3 md:px-8 md:py-4 text-lg font-medium text-white border-2 border-white/20 rounded-full backdrop-blur-sm hover:bg-white/10 transform hover:-translate-y-1 transition-all duration-200"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => navigate('/auth')}
                    className="px-6 py-3 md:px-8 md:py-4 text-lg font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-full shadow-lg hover:shadow-blue-500/50 transform hover:-translate-y-1 transition-all duration-200"
                  >
                    Get Started
                  </button>
                </>
              )}
            </div>
          </div>
        </section>

        {/* Features Section (Value Props) */}
        <section className="py-20 bg-gray-800/50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 mb-4">
                Why Choose Our Card Maker?
              </h2>
              <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                Create professional-looking Yu-Gi-Oh! cards with our powerful yet easy-to-use tools
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="group">
                <div className="flex flex-col items-center p-8 rounded-xl backdrop-blur-md bg-white/5 border border-white/10 transition-all duration-300 hover:transform hover:-translate-y-2 hover:bg-white/10">
                  <div className="mb-4 p-3 bg-blue-500 rounded-full">
                    {/* Icon */}
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m18 0h-2M5 15H3m18 0h-2M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="mb-4 text-2xl font-bold text-white text-center">Custom Design</h3>
                  <p className="text-gray-300 text-center">
                    Choose from various card types, attributes, and levels to make your card unique.
                  </p>
                </div>
              </div>
              {/* Feature 2 */}
              <div className="group">
                <div className="flex flex-col items-center p-8 rounded-xl backdrop-blur-md bg-white/5 border border-white/10 transition-all duration-300 hover:transform hover:-translate-y-2 hover:bg-white/10">
                  <div className="mb-4 p-3 bg-green-500 rounded-full">
                    {/* Icon */}
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-.447.894L15 14M5 10l4.553-2.276A1 1 0 0111 8.618v6.764a1 1 0 01-.447.894L5 14M15 10l-4.553 2.276A1 1 0 019 11.382v-6.764a1 1 0 01.447-.894L15 4M5 10l-4.553 2.276A1 1 0 013 11.382v-6.764a1 1 0 01.447-.894L5 4z" />
                    </svg>
                  </div>
                  <h3 className="mb-4 text-2xl font-bold text-white text-center">Easy to Use</h3>
                  <p className="text-gray-300 text-center">
                    Intuitive and user-friendly interface for creating stunning cards in minutes.
                  </p>
                </div>
              </div>
              {/* Feature 3 */}
              <div className="group">
                <div className="flex flex-col items-center p-8 rounded-xl backdrop-blur-md bg-white/5 border border-white/10 transition-all duration-300 hover:transform hover:-translate-y-2 hover:bg-white/10">
                  <div className="mb-4 p-3 bg-purple-500 rounded-full">
                    {/* Icon */}
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2H6a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="mb-4 text-2xl font-bold text-white text-center">Save & Share</h3>
                  <p className="text-gray-300 text-center">
                    Save your कार्ड creations securely and share them with friends and the community.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        {/* Statistics Section */}
        <section className="py-16 bg-gradient-to-r from-blue-900/30 to-purple-900/30">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center p-6">
                <div className="text-4xl font-bold text-blue-400 mb-2">10,000+</div>
                <div className="text-gray-300">Cards Created</div>
              </div>
              <div className="text-center p-6">
                <div className="text-4xl font-bold text-purple-400 mb-2">5,000+</div>
                <div className="text-gray-300">Active Users</div>
              </div>
              <div className="text-center p-6">
                <div className="text-4xl font-bold text-blue-400 mb-2">4.9/5</div>
                <div className="text-gray-300">User Rating</div>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-20 bg-gray-800/30">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center text-white mb-12">What Our Users Say</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="p-6 rounded-xl bg-white/5 backdrop-blur-md">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-xl">
                    J
                  </div>
                  <div className="ml-4">
                    <div className="text-white font-semibold">John D.</div>
                    <div className="text-gray-400 text-sm">Card Creator</div>
                  </div>
                </div>
                <p className="text-gray-300">"This tool made creating custom Yu-Gi-Oh! cards a breeze. The interface is intuitive and the results look professional!"</p>
              </div>
              <div className="p-6 rounded-xl bg-white/5 backdrop-blur-md">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xl">
                    S
                  </div>
                  <div className="ml-4">
                    <div className="text-white font-semibold">Sarah M.</div>
                    <div className="text-gray-400 text-sm">Duelist</div>
                  </div>
                </div>
                <p className="text-gray-300">"I love how easy it is to experiment with different card designs. The customization options are fantastic!"</p>
              </div>
              <div className="p-6 rounded-xl bg-white/5 backdrop-blur-md">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-green-500 to-blue-500 flex items-center justify-center text-white font-bold text-xl">
                    R
                  </div>
                  <div className="ml-4">
                    <div className="text-white font-semibold">Ryan K.</div>
                    <div className="text-gray-400 text-sm">Collector</div>
                  </div>
                </div>
                <p className="text-gray-300">"The quality of the cards is amazing. Every detail is perfect, and sharing with the community is seamless."</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 relative"> {/* Increased py for more visual space */}
          <div className="container mx-auto px-4 text-center max-w-3xl relative z-10">
            {/* Background Elements */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-3xl backdrop-blur-xl -z-10"></div>
            <h2 className="mb-8 text-3xl md:text-4xl font-bold text-white">
              Ready to Create Your First Card?
            </h2>
            <p className="mb-12 text-xl text-gray-300"> {/* Increased mb for spacing */}
              Join our community of card creators and bring your ideas to life. Start designing today!
            </p>
            <button
              onClick={() => navigate(session ? '/create' : '/auth')}
              className="px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-purple-600 to-blue-600 rounded-full shadow-md hover:shadow-lg transform hover:-translate-y-1 transition-all duration-200"
            >
              {session ? 'Start Creating Now' : 'Get Started for Free'}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
