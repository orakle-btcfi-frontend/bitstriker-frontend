import { Navigation } from '@/components/Navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Bell, Moon, Globe, Shield, Database, Palette } from 'lucide-react';

const SettingsPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <Navigation />

      <div className="container mx-auto px-6 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account preferences and trading settings
          </p>
        </div>

        <div className="space-y-6">
          {/* General Settings */}
          <Card className="glass-card p-6">
            <div className="flex items-center space-x-3 mb-6">
              <Globe className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold">General</h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Dark Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    Toggle between light and dark themes
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Language</Label>
                  <p className="text-sm text-muted-foreground">
                    Select your preferred language
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  English
                </Button>
              </div>
            </div>
          </Card>

          {/* Notifications */}
          <Card className="glass-card p-6">
            <div className="flex items-center space-x-3 mb-6">
              <Bell className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold">Notifications</h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Trade Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified when your trades are executed
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Price Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive alerts for significant price movements
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive important updates via email
                  </p>
                </div>
                <Switch />
              </div>
            </div>
          </Card>

          {/* Trading Settings */}
          <Card className="glass-card p-6">
            <div className="flex items-center space-x-3 mb-6">
              <Palette className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold">Trading</h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Auto-refresh Data</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically update market data
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Confirm Trades</Label>
                  <p className="text-sm text-muted-foreground">
                    Require confirmation before executing trades
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Advanced Trading Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable advanced trading features
                  </p>
                </div>
                <Switch />
              </div>
            </div>
          </Card>

          {/* Security */}
          <Card className="glass-card p-6">
            <div className="flex items-center space-x-3 mb-6">
              <Shield className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold">Security</h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Two-Factor Authentication</Label>
                  <p className="text-sm text-muted-foreground">
                    Add an extra layer of security
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  Setup
                </Button>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Session Timeout</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically log out after inactivity
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  30 minutes
                </Button>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Login History</Label>
                  <p className="text-sm text-muted-foreground">
                    View recent login activity
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  View
                </Button>
              </div>
            </div>
          </Card>

          {/* Data & Privacy */}
          <Card className="glass-card p-6">
            <div className="flex items-center space-x-3 mb-6">
              <Database className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold">Data & Privacy</h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Data Collection</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow analytics for better user experience
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Export Data</Label>
                  <p className="text-sm text-muted-foreground">
                    Download your trading data
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  Export
                </Button>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Delete Account</Label>
                  <p className="text-sm text-muted-foreground">
                    Permanently delete your account
                  </p>
                </div>
                <Button variant="destructive" size="sm">
                  Delete
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
