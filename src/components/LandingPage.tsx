import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { BookOpen, Users, ArrowRight, Lightbulb, RefreshCw } from 'lucide-react';
import heroBackground from '@/assets/hero-background.jpg';
import LoginModal from './LoginModal';

const LandingPage = () => {
  const [showLogin, setShowLogin] = useState(false);

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Hero Background */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroBackground})` }}
      >
        <div className="absolute inset-0 hero-background opacity-80" />
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Navigation */}
        <nav className="p-6 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <BookOpen className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold text-foreground">KnowledgeX</span>
          </div>
        </nav>

        {/* Hero Section */}
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="fade-in">
              <h1 className="text-5xl md:text-7xl font-bold text-foreground mb-6 leading-tight">
                Exchange
                <span className="bg-gradient-to-r from-primary-glow to-secondary-glow bg-clip-text text-transparent">
                  {" "}Knowledge
                </span>
                <br />
                Not Money
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Learn what you want by teaching what you know. Connect with learners and experts in a revolutionary knowledge exchange platform.
              </p>
            </div>

            <div className="slide-up">
              <Button 
                onClick={() => setShowLogin(true)}
                className="hero-button text-lg px-8 py-4 h-auto group"
              >
                Get Started
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="px-6 pb-20">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bounce-in glass-effect p-6 rounded-xl text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-primary to-primary-glow rounded-full flex items-center justify-center">
                  <RefreshCw className="h-8 w-8 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">Knowledge Exchange</h3>
                <p className="text-muted-foreground">Trade your expertise for new skills. No money involved, just pure knowledge sharing.</p>
              </div>

              <div className="bounce-in glass-effect p-6 rounded-xl text-center" style={{ animationDelay: '0.2s' }}>
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-secondary to-secondary-glow rounded-full flex items-center justify-center">
                  <Users className="h-8 w-8 text-secondary-foreground" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">Expert Community</h3>
                <p className="text-muted-foreground">Connect with passionate learners and experienced professionals from around the world.</p>
              </div>

              <div className="bounce-in glass-effect p-6 rounded-xl text-center" style={{ animationDelay: '0.4s' }}>
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-accent to-accent-glow rounded-full flex items-center justify-center">
                  <Lightbulb className="h-8 w-8 text-accent-foreground" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">Personalized Learning</h3>
                <p className="text-muted-foreground">Find the perfect match for your learning goals and teaching abilities.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Login Modal */}
      <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} />
    </div>
  );
};

export default LandingPage;