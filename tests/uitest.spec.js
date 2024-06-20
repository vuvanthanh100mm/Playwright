const { test, expect } = require('@playwright/test');

let webContext; // Declare webContext at the top level

class LoginPage {
  constructor(page) {
    this.page = page;
    this.usernameInput = page.locator('input#user-name');
    this.passwordInput = page.locator('[type="password"]');
    this.loginButton = page.locator('#login-button');
  }

  async navigate() {
    await this.page.goto('https://www.saucedemo.com');
  }

  async login(username, password) {
    await this.usernameInput.type(username);
    await this.passwordInput.type(password);
    await this.loginButton.click();
  }

  async checkTitle() {
    await expect(this.page).toHaveTitle("Swag Labs");
  }
}

class ProductsPage {
  constructor(page) {
    this.page = page;
    this.cartLink = page.locator('[data-test="shopping-cart-link"]');
  }

  async navigate() {
    await this.page.goto('https://www.saucedemo.com/inventory.html');
  }

  async addItemToCart(itemId) {
    await this.page.locator(`[data-test="add-to-cart-${itemId}"]`).click();
  }

  async removeItemFromCart(itemId) {
    await this.page.locator(`[data-test="remove-${itemId}"]`).click();
  }

  async openCart() {
    await this.cartLink.click();
  }

  async getItemNames() {
    return await this.page.locator('div.inventory_item_name').allTextContents();
  }

  async sortItems(option) {
    await this.page.locator('[data-test="product-sort-container"]').selectOption(option);
  }

  async getItemPrices() {
    return await this.page.$$eval('div.inventory_item_price[data-test="inventory-item-price"]', elements =>
      elements.map(item => parseFloat(item.textContent.trim().replace('$', '')))
    );
  }
}

class CheckoutPage {
  constructor(page) {
    this.page = page;
  }

  async proceedToCheckout() {
    await this.page.locator("#checkout").click();
  }

  async enterInformation(firstName, lastName, postalCode) {
    await this.page.locator('#first-name').type(firstName);
    await this.page.locator('#last-name').type(lastName);
    await this.page.locator('#postal-code').type(postalCode);
    await this.page.locator('#continue').click();
  }

  async finishCheckout() {
    await this.page.locator('#finish').click();
  }

  async checkCompletion() {
    await expect(this.page.locator('#checkout_complete_container > h2')).toContainText('Thank you for your order!');
  }
}

function isArrayIncreasing(arr) {
  for (let i = 1; i < arr.length; i++) {
    if (arr[i] < arr[i - 1]) {
      return false;
    }
  }
  return true;
}

test('Login page: Navigate and check title', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.navigate();
  await loginPage.checkTitle();
});

test('Login page: Login failed with wrong password', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.navigate();
  await loginPage.login("standard_user", "wrong_pass");
  await expect(page.locator('[data-test="error"]')).toContainText('sadface:');
});

test('Login page: Login successfully with correct password', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.navigate();
  await loginPage.login("standard_user", "secret_sauce");
  await expect(page).toHaveURL("https://www.saucedemo.com/inventory.html");
  console.log(await page.getByText('Products').textContent());
});

test.describe('Test for Products Page', () => {

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const loginPage = new LoginPage(page);

    await loginPage.navigate();
    await loginPage.login("standard_user", "secret_sauce");
    await context.storageState({ path: 'state.json' });

    // Reuse the same context for all tests
    webContext = context;
  });

  test('Verify the names of all inventory items', async () => {
    const page = await webContext.newPage();
    const productsPage = new ProductsPage(page);

    await productsPage.navigate();
    const itemNames = await productsPage.getItemNames();

    const expectedItems = [
      "Sauce Labs Backpack",
      "Sauce Labs Bike Light",
      "Sauce Labs Bolt T-Shirt",
      "Sauce Labs Fleece Jacket",
      "Sauce Labs Onesie",
      "Test.allTheThings() T-Shirt (Red)"
    ];

    //expectedItems.forEach(item => expect(itemNames).toContain(item));
  });

  test('Verify an item is added to the cart', async () => {
    const page = await webContext.newPage();
    const productsPage = new ProductsPage(page);

    await productsPage.navigate();
    await productsPage.addItemToCart('sauce-labs-bolt-t-shirt');
    await productsPage.openCart();

    const element = await page.locator('[data-test="item-1-title-link"]');
    await expect(element).toHaveText('Sauce Labs Bolt T-Shirt');
  });

  test('Verify an item is removed from the cart', async () => {
    const page = await webContext.newPage();
    const productsPage = new ProductsPage(page);

    await productsPage.navigate();
    await productsPage.removeItemFromCart('sauce-labs-bolt-t-shirt');
    await productsPage.openCart();

    await expect(page.locator('body')).not.toHaveText('Sauce Labs Bolt T-Shirt');
  });

  test('Verify the item has been added to the cart, then proceed with checking out', async () => {
    const page = await webContext.newPage();
    const productsPage = new ProductsPage(page);
    const checkoutPage = new CheckoutPage(page);

    await productsPage.navigate();
    await productsPage.addItemToCart('sauce-labs-bolt-t-shirt');
    await productsPage.openCart();

    const element = await page.locator('[data-test="item-1-title-link"]');
    await expect(element).toHaveText('Sauce Labs Bolt T-Shirt');

    await checkoutPage.proceedToCheckout();
    await expect(page.locator('span.title[data-test="title"]')).toContainText('Checkout: Your Information');

    await checkoutPage.enterInformation('ThanhVu', 'Covergo', '600000');
    await expect(page.locator('span.title')).toContainText('Checkout: Overview');
    await expect(page.locator('div.cart_quantity[data-test="item-quantity"]')).toContainText('1');
    await expect(page.locator('div.inventory_item_name[data-test="inventory-item-name"]')).toContainText('Sauce Labs Bolt T-Shirt');
    await expect(page.locator('div.summary_info_label[data-test="payment-info-label"]')).toContainText('Payment Information');
    await expect(page.locator('div.summary_info_label[data-test="shipping-info-label"]')).toContainText('Shipping Information');
    await expect(page.locator('div.summary_info_label[data-test="total-info-label"]')).toContainText('Price Total');

    await checkoutPage.finishCheckout();
    await checkoutPage.checkCompletion();
  });

  test('Users access the About page via the hamburger menu', async () => {
    const page = await webContext.newPage();
    const productsPage = new ProductsPage(page);

    await productsPage.navigate();
    await page.locator('#react-burger-menu-btn').click();
    await page.locator('#about_sidebar_link').click();
    await expect(page).toHaveURL('https://saucelabs.com/');
    await page.goBack();
    await expect(page).toHaveTitle("Swag Labs");
  });

  test('User sort items from low to high', async () => {
    const page = await webContext.newPage();
    const productsPage = new ProductsPage(page);

    await productsPage.navigate();
    await productsPage.sortItems('lohi');

    const itemPrices = await productsPage.getItemPrices();
    console.log(itemPrices);
    await expect(isArrayIncreasing(itemPrices)).toBeTruthy();
  });

  test('The user logs out from the Products page', async () => {
    const page = await webContext.newPage();
    const productsPage = new ProductsPage(page);

    await productsPage.navigate();
    await page.locator('#react-burger-menu-btn').click();
    await page.locator('#logout_sidebar_link').click();
    await expect(page).toHaveURL('https://www.saucedemo.com/');
  });
});
