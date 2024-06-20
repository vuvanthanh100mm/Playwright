const { test, expect } = require('@playwright/test');

let webContext;

function isArrayIncreasing(arr) {
  for (let i = 1; i < arr.length; i++) {
    if (arr[i] < arr[i - 1]) {
      return false;
    }
  }
  return true;
}

// Test case 1: Navigating to the login page and checking the title
test('Login page: Navigate and check title', async ({ page }) => {
  await page.goto('https://www.saucedemo.com');
  await expect(page).toHaveTitle("Swag Labs");
});

// Test case 2: Login failed with wrong password
test('Login page: Login failed with wrong password', async ({ page }) => {
  const passwordLogin = page.locator('[type="password"]');
  const loginButton = page.locator('#login-button');

  await page.goto('https://www.saucedemo.com');
  await page.locator('input#user-name').type("standard_user");
  await passwordLogin.type("wrong_pass");
  await loginButton.click();

  await expect(page.locator('[data-test="error"]')).toContainText('sadface:');
});

// Test case 3: Login successfully with correct password
test('Login page: Login successfully with correct password', async ({ page }) => {
  const passwordLogin = page.locator('[type="password"]');
  const loginButton = page.locator('#login-button');

  await page.goto('https://www.saucedemo.com');
  await page.locator('input#user-name').type("standard_user");
  await passwordLogin.type("secret_sauce");
  await loginButton.click();

  await expect(page).toHaveURL("https://www.saucedemo.com/inventory.html");
  console.log(await page.getByText('Products').textContent());
});


test.describe('Test for Products Page', () => {

  test.beforeAll(async ({ browser }) => {
    // Create a new browser context
    const context = await browser.newContext();
    // Open a new page within the context
    const page = await context.newPage();
    // Navigate to the login page
    await page.goto('https://www.saucedemo.com');
    // Verify the page title
    await expect(page).toHaveTitle("Swag Labs");
    // Perform the login
    await page.locator('input#user-name').type("standard_user");
    await page.locator('[type="password"]').type("secret_sauce");
    await page.locator('#login-button').click();
    // Save the storage state for authentication persistence
    await context.storageState({ path: 'state.json' });
    webContext = await browser.newContext({ storageState: 'state.json' });
  });

  // Test case 4: Verify the names of all inventory items
  test('Verify the names of all inventory items', async () => {
    const page = await webContext.newPage();
    await page.goto('https://www.saucedemo.com/inventory.html');
    // Get all item names
    const itemNames = await page.locator('div.inventory_item_name').allTextContents();
    // Verify
    expect(itemNames).toContain("Sauce Labs Backpack");
    expect(itemNames).toContain("Sauce Labs Bike Light");
    expect(itemNames).toContain("Sauce Labs Bolt T-Shirt");
    expect(itemNames).toContain("Sauce Labs Fleece Jacket");
    expect(itemNames).toContain("Sauce Labs Onesie");
    expect(itemNames).toContain("Test.allTheThings() T-Shirt (Red)");
  });

  // Test case 5: Verify an item is added to the cart
  test('Verify an item is added to the cart', async () => {
    const page = await webContext.newPage();
    await page.goto('https://www.saucedemo.com/inventory.html');
    await page.waitForSelector('#add-to-cart-sauce-labs-bolt-t-shirt');
    // Add item to cart
    await page.locator('[data-test="add-to-cart-sauce-labs-bolt-t-shirt"]').click();
    // Open cart
    await page.locator('[data-test="shopping-cart-link"]').click();
    // Get the text content of the element
    const element = await page.locator('[data-test="item-1-title-link"]');
    await expect(element).toHaveText('Sauce Labs Bolt T-Shirt');
  });

  // Test case 6: Verify an item is removed from the cart
  test('Verify an item is removed from the cart', async () => {
    const page = await webContext.newPage();
    await page.goto('https://www.saucedemo.com/inventory.html');
    // Remove item from cart
    await page.locator('button[data-test="remove-sauce-labs-bolt-t-shirt"]').click();
    // Open cart
    await page.locator('[data-test="shopping-cart-link"]').click();
    // Get the text content of the element
    await expect(page.locator('body')).not.toHaveText('Sauce Labs Bolt T-Shirt');
  });

  // Test case 7: Verify the item has been added to the cart, then proceed with checking out.
  test('Verify the item has been added to the cart, then proceed with checking out', async () => {
    const page = await webContext.newPage();
    await page.goto('https://www.saucedemo.com/inventory.html');
    await page.waitForSelector('#add-to-cart-sauce-labs-bolt-t-shirt');
    // Add item to cart
    await page.locator('[data-test="add-to-cart-sauce-labs-bolt-t-shirt"]').click();
    // Open cart
    await page.locator('[data-test="shopping-cart-link"]').click();
    // Get the text content of the element
    const element = await page.locator('[data-test="item-1-title-link"]');
    await expect(element).toHaveText('Sauce Labs Bolt T-Shirt');
    // Open Checkout: Your Information page
    await page.locator("#checkout").click();
    await expect(page.locator('span.title[data-test="title"]')).toContainText('Checkout: Your Information');
    // Enter your information to checkout
    await page.locator('#first-name').type('ThanhVu');
    await page.locator('#last-name').type('Covergo');
    await page.locator('#postal-code').type('600000');
    // Open Checkout: Overview
    await page.locator('#continue').click();
    await expect(page.locator('span.title')).toContainText('Checkout: Overview');
    // Then verify
    await expect(page.locator('div.cart_quantity[data-test="item-quantity"]')).toContainText('1');
    await expect(page.locator('div.inventory_item_name[data-test="inventory-item-name"]')).toContainText('Sauce Labs Bolt T-Shirt');
    await expect(page.locator('div.summary_info_label[data-test="payment-info-label"]')).toContainText('Payment Information');
    await expect(page.locator('div.summary_info_label[data-test="shipping-info-label"]')).toContainText('Shipping Information');
    await expect(page.locator('div.summary_info_label[data-test="total-info-label"]')).toContainText('Price Total');
    // Finish
    await page.locator('#finish').click();
    await expect(page.locator('#checkout_complete_container > h2')).toContainText('Thank you for your order!');

  });


  // Test case 8: Verify that users access the About page via the hamburger menu.
  test('users access the About page via the hamburger menu', async () => {
    const page = await webContext.newPage();
    await page.goto('https://www.saucedemo.com/inventory.html');
    // Click on hamburger menu
    await page.locator('#react-burger-menu-btn').click();
    // Click on About menuitem
    await page.locator('#about_sidebar_link').click();
    // Go to About page
    await expect(page).toHaveURL('https://saucelabs.com/');
    // GO back
    await page.goBack();
    await expect(page).toHaveTitle("Swag Labs");
  });

  // Test case 9: Verify that the user sort items from low to high
  test('User sort items from low to high', async () => {
    const page = await webContext.newPage();
    await page.goto('https://www.saucedemo.com/inventory.html');
    // Choose low to high
    await page.locator('[data-test="product-sort-container"]').selectOption('lohi');
    // Verify
    const itemPrices = await page.$$eval('div.inventory_item_price[data-test="inventory-item-price"]', elements =>
      elements.map(item => {
        const priceText = item.textContent.trim();
        return parseFloat(priceText.replace('$', ''));
      })
    );
    console.log(itemPrices);
    await expect(isArrayIncreasing(itemPrices)).toBeTruthy();
  });

  // Test case 10: Verify that the user logs out from the Products page.
  test('the user logs out from the Products page.', async () => {
    const page = await webContext.newPage();
    await page.goto('https://www.saucedemo.com/inventory.html');
    // Click on hamburger menu
    await page.locator('#react-burger-menu-btn').click();
    // Click on logout menuitem
    await page.locator('#logout_sidebar_link').click();
    await expect(page).toHaveURL('https://www.saucedemo.com/');
  });



});

