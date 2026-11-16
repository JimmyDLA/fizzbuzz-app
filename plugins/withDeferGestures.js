const { withAppDelegate } = require("@expo/config-plugins");

// Plugin to inject UIViewController category/extension for deferring system gestures on iOS
// Supports both Swift (Expo SDK 54+) and Objective-C AppDelegate templates
function withDeferredSystemGestures(config) {
  return withAppDelegate(config, (appDelegate) => {
    const isSwift = appDelegate.modResults.language === 'swift' || appDelegate.modResults.path?.endsWith('.swift');

    if (isSwift) {
      let contents = appDelegate.modResults.contents;
      
      // 1. Ensure UIKit is imported (required for UIViewController and UIRectEdge)
      if (!contents.includes('import UIKit')) {
        contents = contents.replace('import Expo', 'import Expo\nimport UIKit');
      }
      
      // 2. Inject the swizzling trigger inside didFinishLaunchingWithOptions
      const targetRegex = /(didFinishLaunchingWithOptions launchOptions:[\s\S]*?->\s*Bool\s*\{)/;
      const swizzleTrigger = '\n    _ = UIViewController.swizzlePreferredScreenEdges';
      
      if (contents.includes('_ = UIViewController.swizzlePreferredScreenEdges')) {
        // Already injected, do nothing
      } else if (targetRegex.test(contents)) {
        contents = contents.replace(targetRegex, `$1${swizzleTrigger}`);
        
        // 3. Append the UIViewController swizzling extension at the end of the Swift file
        contents += `

// Added by withDeferGestures config-plugin
extension UIViewController {
  static let swizzlePreferredScreenEdges: Void = {
    let originalSelector = #selector(getter: UIViewController.preferredScreenEdgesDeferringSystemGestures)
    let swizzledSelector = #selector(swizzled_preferredScreenEdgesDeferringSystemGestures)
    
    guard let originalMethod = class_getInstanceMethod(UIViewController.self, originalSelector),
          let swizzledMethod = class_getInstanceMethod(UIViewController.self, swizzledSelector) else {
        return
    }
    
    method_exchangeImplementations(originalMethod, swizzledMethod)
  }()
  
  @objc func swizzled_preferredScreenEdgesDeferringSystemGestures() -> UIRectEdge {
    return .bottom
  }
}
`;
      } else {
        console.warn("withDeferGestures: Could not find target method in AppDelegate.swift");
      }

      appDelegate.modResults.contents = contents;
    } else {
      // Objective-C implementation
      const searchString = '@implementation AppDelegate';
      const replacement = `
@implementation UIViewController (DeferredSystemGestures)
- (UIRectEdge)preferredScreenEdgesDeferringSystemGestures {
    return UIRectEdgeBottom;
}
@end

@implementation AppDelegate`;

      if (appDelegate.modResults.contents.includes(searchString)) {
        appDelegate.modResults.contents = appDelegate.modResults.contents.replace(
          searchString,
          replacement
        );
      } else {
        console.warn("withDeferGestures: Could not find '@implementation AppDelegate' in AppDelegate.mm");
      }
    }

    return appDelegate;
  });
}

module.exports = withDeferredSystemGestures;
