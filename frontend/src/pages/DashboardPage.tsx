
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { MobileNav } from '../components/ui/mobile-nav';

export function DashboardPage() {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-3 sm:py-4 flex justify-between items-center">
          <h1 className="text-xl sm:text-2xl font-bold">ContentMagic</h1>
          
          {/* Desktop navigation */}
          <div className="hidden md:flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              Welcome, {user?.email}
            </span>
            <Button variant="outline" onClick={handleLogout}>
              Sign out
            </Button>
          </div>

          {/* Mobile navigation */}
          <MobileNav />
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 sm:py-8">
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="sm:col-span-2 lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">Account Info</CardTitle>
              <CardDescription>Your account details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm sm:text-base">
                <p><strong>Email:</strong> <span className="break-all">{user?.email}</span></p>
                <p><strong>Subscription:</strong> <span className="capitalize">{user?.subscriptionTier}</span></p>
                <p><strong>Monthly Usage:</strong> {user?.monthlyUsage}/10</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">Content Generation</CardTitle>
              <CardDescription>Create AI-powered content</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Generate captions, images, and videos for your social media platforms.
              </p>
              <Button className="w-full" disabled>
                Coming Soon
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">Content Library</CardTitle>
              <CardDescription>Manage your content</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                View and organize all your generated content in one place.
              </p>
              <Button className="w-full" disabled>
                Coming Soon
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}