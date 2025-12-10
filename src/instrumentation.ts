/**
 * Next.js Instrumentation
 * 
 * This file is automatically called by Next.js when the server starts.
 * We use it to perform startup validation before the application begins
 * accepting requests.
 */

export async function register() {
  // Only run on the server
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { performStartupValidation } = await import('./lib/startup-validator');
    
    try {
      console.log('🚀 Running startup validation...\n');
      const result = await performStartupValidation();
      
      if (!result.canProceed) {
        console.error('❌ Startup validation failed. Application may not function correctly.');
        console.error('Please fix the configuration errors before proceeding.\n');
        
        // In development, we log but allow the app to start so developers can see the error page
        // In production, you might want to exit the process
        if (process.env.NODE_ENV === 'production') {
          console.error('⚠️  Application is running in production mode with configuration errors!');
          console.error('This may cause runtime failures. Please fix immediately.\n');
        }
      } else {
        console.log('✅ Startup validation completed successfully!\n');
      }
    } catch (error) {
      console.error('❌ Unexpected error during startup validation:', error);
      console.error('Application may not function correctly.\n');
    }
  }
}
