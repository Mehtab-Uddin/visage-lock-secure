import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Scan, Shield, Zap } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-8 animate-fade-in">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-primary/20 mb-6 animate-pulse-glow">
              <Scan className="w-12 h-12 text-primary" />
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              Face Recognition Auth
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Secure, fast, and passwordless authentication using advanced biometric technology
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16 animate-fade-in">
            <Button onClick={() => navigate('/register')} size="lg" className="text-lg px-8">
              Get Started
            </Button>
            <Button onClick={() => navigate('/login')} size="lg" variant="outline" className="text-lg px-8">
              Sign In
            </Button>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-6 mt-16 animate-fade-in">
            <div className="bg-card p-6 rounded-xl border border-border">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Secure</h3>
              <p className="text-sm text-muted-foreground">
                Your biometric data is encrypted and stored securely with industry-standard protection
              </p>
            </div>

            <div className="bg-card p-6 rounded-xl border border-border">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Fast</h3>
              <p className="text-sm text-muted-foreground">
                Authenticate in seconds with just a glance - no typing required
              </p>
            </div>

            <div className="bg-card p-6 rounded-xl border border-border">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                <Scan className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Easy</h3>
              <p className="text-sm text-muted-foreground">
                Simple setup process with real-time face detection and guidance
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
