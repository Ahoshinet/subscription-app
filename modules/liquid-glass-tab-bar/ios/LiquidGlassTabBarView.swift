import ExpoModulesCore
import SwiftUI
import UIKit

private struct LiquidGlassTab {
  let selectedSystemImage: String
  let systemImage: String
  let label: String
}

private struct LiquidGlassTabBarContent: View {
  let selectedIndex: Int
  let onSelect: (Int) -> Void

  private let tabs = [
    LiquidGlassTab(selectedSystemImage: "house.fill", systemImage: "house", label: "Home"),
    LiquidGlassTab(selectedSystemImage: "calendar", systemImage: "calendar", label: "Calendar"),
    LiquidGlassTab(selectedSystemImage: "gearshape.fill", systemImage: "gearshape", label: "Settings")
  ]

  var body: some View {
    glassContainer {
      applyGlassEffect(to: glassBar)
    }
  }

  private var glassBar: some View {
    HStack(spacing: 0) {
      ForEach(Array(tabs.enumerated()), id: \.offset) { index, tab in
        let isSelected = selectedIndex == index

        Button {
          onSelect(index)
        } label: {
          Image(systemName: isSelected ? tab.selectedSystemImage : tab.systemImage)
            .font(.system(size: 23, weight: .medium))
            .foregroundStyle(isSelected ? Color.accentColor : Color.secondary)
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .accessibilityLabel(tab.label)
        .accessibilityValue(isSelected ? "Selected" : "")
      }
    }
    .padding(.horizontal, 6)
    .frame(maxWidth: .infinity)
    .frame(height: 60)
  }

  @ViewBuilder
  private func glassContainer<Content: View>(@ViewBuilder content: () -> Content) -> some View {
#if compiler(>=6.2)
    if #available(iOS 26.0, *) {
      GlassEffectContainer(spacing: 8) {
        content()
      }
    } else {
      content()
    }
#else
    content()
#endif
  }

  @ViewBuilder
  private func applyGlassEffect<Content: View>(to content: Content) -> some View {
#if compiler(>=6.2)
    if #available(iOS 26.0, *) {
      content.glassEffect(.regular.interactive(), in: Capsule())
    } else {
      content.background(.ultraThinMaterial, in: Capsule())
    }
#else
    content.background(.ultraThinMaterial, in: Capsule())
#endif
  }
}

public final class LiquidGlassTabBarView: ExpoView {
  private let onTabPress = EventDispatcher()
  private var hostingController: UIHostingController<AnyView>?

  private var selectedIndex = 0 {
    didSet {
      updateRootView()
    }
  }

  private var colorScheme: String? {
    didSet {
      updateRootView()
    }
  }

  public required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    backgroundColor = .clear
  }

  public override func layoutSubviews() {
    super.layoutSubviews()

    if hostingController == nil {
      mountHostingController()
    }
  }

  func setSelectedIndex(_ index: Int) {
    selectedIndex = index
  }

  func setColorScheme(_ scheme: String?) {
    colorScheme = scheme
  }

  private func mountHostingController() {
    let controller = UIHostingController(rootView: makeRootView())
    controller.view.backgroundColor = .clear
    controller.view.translatesAutoresizingMaskIntoConstraints = false

    addSubview(controller.view)
    NSLayoutConstraint.activate([
      controller.view.leadingAnchor.constraint(equalTo: leadingAnchor),
      controller.view.trailingAnchor.constraint(equalTo: trailingAnchor),
      controller.view.topAnchor.constraint(equalTo: topAnchor),
      controller.view.bottomAnchor.constraint(equalTo: bottomAnchor)
    ])

    hostingController = controller
  }

  private func updateRootView() {
    hostingController?.rootView = makeRootView()
  }

  private func makeRootView() -> AnyView {
    let content = LiquidGlassTabBarContent(selectedIndex: selectedIndex) { [weak self] index in
      self?.onTabPress(["index": index])
    }

    switch colorScheme {
    case "dark":
      return AnyView(content.preferredColorScheme(.dark))
    case "light":
      return AnyView(content.preferredColorScheme(.light))
    default:
      return AnyView(content)
    }
  }
}
