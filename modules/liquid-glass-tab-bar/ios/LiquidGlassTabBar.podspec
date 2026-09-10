Pod::Spec.new do |s|
  s.name         = 'LiquidGlassTabBar'
  s.version      = '1.0.0'
  s.summary      = 'Native SwiftUI Liquid Glass tab bar for Subscription Manager'
  s.platforms    = { :ios => '16.4' }
  s.source       = { :path => '.' }

  s.dependency 'ExpoModulesCore'

  s.static_framework = true
  s.source_files = '**/*.{h,m,swift}'
end
