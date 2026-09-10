import ExpoModulesCore

public final class LiquidGlassTabBarModule: Module {
  public func definition() -> ModuleDefinition {
    Name("LiquidGlassTabBar")

    View(LiquidGlassTabBarView.self) {
      Events("onTabPress")

      Prop("selectedIndex") { (view: LiquidGlassTabBarView, index: Int) in
        view.setSelectedIndex(index)
      }

      Prop("colorScheme") { (view: LiquidGlassTabBarView, colorScheme: String?) in
        view.setColorScheme(colorScheme)
      }
    }
  }
}
