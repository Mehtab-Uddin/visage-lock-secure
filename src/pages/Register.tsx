import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { FaceScanner } from '@/components/FaceScanner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { descriptorToArray } from '@/lib/faceRecognition';
import { ArrowLeft, UserPlus } from 'lucide-react';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [faceDescriptor, setFaceDescriptor] = useState<Float32Array | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleContinue = () => {
    if (!email || !password) {
      toast({
        title: 'Missing Information',
        description: 'Please enter your email and password.',
        variant: 'destructive',
      });
      return;
    }
    
    if (password.length < 6) {
      toast({
        title: 'Invalid Password',
        description: 'Password must be at least 6 characters.',
        variant: 'destructive',
      });
      return;
    }
    
    setShowScanner(true);
  };

  const handleFaceDetected = (descriptor: Float32Array) => {
    if (!faceDescriptor) {
      setFaceDescriptor(descriptor);
    }
  };

  const handleRegister = async () => {
    if (!faceDescriptor) {
      toast({
        title: 'No Face Detected',
        description: 'Please position your face in the camera.',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Sign up the user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Registration failed');

      // Store face descriptor
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          user_id: authData.user.id,
          email,
          face_descriptor: descriptorToArray(faceDescriptor),
        });

      if (profileError) throw profileError;

      toast({
        title: 'Registration Successful',
        description: 'Your face has been registered successfully!',
      });

      navigate('/dashboard');
    } catch (error: any) {
      console.error('Registration error:', error);
      toast({
        title: 'Registration Failed',
        description: error.message || 'An error occurred during registration.',
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
            onClick={() => setShowScanner(false)}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          
          <div className="text-center mb-8 animate-fade-in">
            <h1 className="text-4xl font-bold mb-2">Register Your Face</h1>
            <p className="text-muted-foreground">
              Position your face in the camera and click Register when ready
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

          <div className="mt-8 flex justify-center">
            <Button
              onClick={handleRegister}
              disabled={!faceDescriptor || isProcessing}
              size="lg"
              className="min-w-48"
            >
              <UserPlus className="w-5 h-5 mr-2" />
              Register Face
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8 animate-fade-in">
          <h1 className="text-4xl font-bold mb-2">Create Account</h1>
          <p className="text-muted-foreground">Enter your details to get started</p>
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

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <Button onClick={handleContinue} className="w-full" size="lg">
            Continue to Face Registration
          </Button>

          <div className="text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <button
              onClick={() => navigate('/login')}
              className="text-primary hover:underline"
            >
              Sign in
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
