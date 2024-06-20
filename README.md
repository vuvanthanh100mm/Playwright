# Playwright

1. Install Visual Studio Code  
   https://code.visualstudio.com/

2. Install Nodejs  
   https://nodejs.org/en

3. Create a Playwright folder. Then open this folder by VS.

4. Init Playwright project  
   npm init playwright@latest
   
5. Set config file  
   In the playwright.config.js file, set testDir: './tests'

6. Run testcases  
   npx playwright test ./tests/uitest.spec.js --project=chromium --headed  
   or  
   npx playwright test "tests/uitest.spec.js" --project=chromium --headed  
