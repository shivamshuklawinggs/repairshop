import { Router } from 'express';

export function debugRouter(router: Router, prefix: string = '') {
  if (!router || !('stack' in router)) {
    console.error('❌ Invalid router object');
    return;
  }

 
  router.stack.forEach((layer: any) => {
    if (layer.route) {
      // This is a route handler
      // const path = prefix + layer.route.path;
      // const methods = Object.keys(layer.route.methods)
      //   .filter(method => layer.route.methods[method])
      //   .map(method => method.toUpperCase());
      
    }
    else if (layer.name === 'router') {
      // This is a sub-router
      let newPrefix = prefix;
      
      if (layer.regexp) {
        const match = layer.regexp.source.match(/\^\\?\/([^\/\\]+)/);
        if (match) {
          newPrefix = prefix + '/' + match[1];
        }
      }
      
     debugRouter(layer.handle, newPrefix);
    }
    else {
      // This is middleware
    }
  });
}
