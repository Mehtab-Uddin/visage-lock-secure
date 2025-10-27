import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { FaceScanner } from '@/components/FaceScanner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { compareFaces, arrayToDescriptor } from '@/lib/faceRecognition';
import { ArrowLeft, LogIn } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [storedDescriptor, setStoredDescriptor] = useState<number[] | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate('/dashboard');
      }
    });
  }, [navigate]);

  const handleContinue = async () => {
    if (!email) {
      toast({
        title: 'Missing Information',
        description: 'Please enter your email.',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Fetch the user's face descriptor
      const { data, error } = await supabase
        .from('profiles')
        .select('face_descriptor')
        .eq('email', email)
        .single();

      if (error || !data) {
        toast({
          title: 'User Not Found',
          description: 'No account found with this email.',
          variant: 'destructive',
        });
        return;
      }

      setStoredDescriptor(data.face_descriptor as number[]);
      setShowScanner(true);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFaceDetected = async (descriptor: Float32Array) => {
    if (!storedDescriptor || isProcessing) return;

    setIsProcessing(true);

    try {
      // Convert descriptor to array for API call
      const descriptorArray = Array.from(descriptor);

      // Call the face authentication edge function
      const { data, error } = await supabase.functions.invoke('face-auth', {
        body: { email, faceDescriptor: descriptorArray }
      });

      if (error || data.error) {
        toast({
          title: 'Face Not Recognized',
          description: data?.error || 'The face does not match our records.',
          variant: 'destructive',
        });
        setIsProcessing(false);
        return;
      }

      // Use the magic link token to sign in
      const { error: authError } = await supabase.auth.verifyOtp({
        email,
        token: data.token,
        type: 'magiclink'
      });

      if (authError) {
        throw authError;
      }

      toast({
        title: 'Face Recognized!',
        description: 'Identity verified successfully. Logging you in...',
      });

      // Navigate to dashboard after successful authentication
      setTimeout(() => {
        navigate('/dashboard');
      }, 1000);

    } catch (error: any) {
      console.error('Login error:', error);
      toast({
        title: 'Login Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (showScanner) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-4xl">
          <Button
            variant="ghost"
            onClick={() => {
              setShowScanner(false);
              setIsProcessing(false);
            }}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          
          <div className="text-center mb-8 animate-fade-in">
            <h1 className="text-4xl font-bold mb-2">Verify Your Identity</h1>
            <p className="text-muted-foreground">
              Look at the camera to authenticate with your face
            </p>
          </div>

          <FaceScanner
            onFaceDetected={handleFaceDetected}
            onError={(error) => {
              toast({
                title: 'Camera Error',
                description: error,
                variant: 'destructive',
              });
            }}
            isProcessing={isProcessing}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8 animate-fade-in">
          <h1 className="text-4xl font-bold mb-2">Welcome Back</h1>
          <p className="text-muted-foreground">Sign in with your face</p>
        </div>

        <div className="bg-card p-8 rounded-2xl space-y-6 animate-fade-in border border-border">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <Button
            onClick={handleContinue}
            className="w-full"
            size="lg"
            disabled={isProcessing}
          >
            <LogIn className="w-5 h-5 mr-2" />
            {isProcessing ? 'Loading...' : 'Continue to Face Scan'}
          </Button>

          <div className="text-center text-sm text-muted-foreground">
            Don't have an account?{' '}
            <button
              onClick={() => navigate('/register')}
              className="text-primary hover:underline"
            >
              Sign up
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
