



HOMEWISE – SMART HOUSEHOLD BUDGET & EXPENSE MANAGEMENT APPLICATION
Act as a senior full-stack developer, UI/UX designer, database architect, AI integration specialist, and software tester.

I want to develop a complete, professional, modern, responsive web application named:

HomeWise – Your Smart Household Budget & Saving Companion

This application is designed primarily for women, homemakers, and families who want to manage household budgets, track daily expenses, organize groceries, save money, store bills, and discover affordable alternatives to expensive household products.

IMPORTANT: This is NOT an e-commerce website or shopping marketplace. It is a household finance management and money-saving assistant.

The application should be simple enough for non-technical users.


2. UI/UX DESIGN
Design a beautiful, elegant, minimal, premium-looking household management dashboard.

Design preferences:

Sage green
Warm beige
Cream
Ivory
Soft white
Subtle neutral borders
Rounded cards
Elegant typography
Soft shadows
Consistent spacing
The application must:

Be fully responsive.
Work properly on desktop, tablet, and mobile.
Have simple navigation.
Use understandable labels.
Avoid clutter.
Avoid unnecessary animations.
Avoid excessive pop-ups.
Have accessible forms and controls.
Provide useful empty states.
Use a clean sidebar on desktop and an appropriate mobile navigation layout.

3. MAIN DASHBOARD
Create a professional dashboard that acts as the central control panel of the application.

The dashboard should contain:

A. Budget Overview:

Total monthly budget.
Total expenses.
Remaining balance.
Savings allocation.
Emergency fund.
Budget utilization percentage.
B. Quick Actions:

Add Expense.
Set Monthly Budget.
Scan a Bill.
Add Grocery Item.
Add Household Expense.
C. Recent Transactions:
Show the latest expenses with:

Expense name.
Category.
Amount.
Date.
Payment method.
D. Budget Progress:
Show category-wise progress indicators.

E. Saving Suggestions:
Display a small section with useful money-saving suggestions.

F. Weekly Spending Snapshot:
Show a compact summary of weekly spending without automatically opening a detailed report.

Allow users to customize or update their monthly budget directly from the dashboard.

The dashboard should be informative but not overcrowded.

4. FLEXIBLE BUDGET MANAGEMENT
Budget management is one of the most important features.

Users must be able to:

Set their own monthly budget.
Change their budget whenever needed.
Create custom spending categories.
Set category-wise spending limits.
Allocate money to savings.
Allocate money to emergency funds.
View available balances.
Track remaining budget.
Default categories:

Groceries.
Household expenses.
Electricity and utilities.
Clothing.
Transportation.
Healthcare.
Personal care.
Home maintenance.
Savings.
Emergency fund.
Extras.
Unexpected expenses.
Allow users to add, edit, rename, and delete custom categories.

Provide optional budget alerts when users approach their spending limits.

Budget alerts should be subtle and useful.

Never force users to follow fixed budget allocations.

All budget calculations must be accurate.

Distinguish between allocated savings, actual savings, and expenses to prevent double-counting.

5. DAILY EXPENSE MANAGEMENT – MANUAL AND AUTOMATIC
IMPORTANT: Bill uploading must NEVER be compulsory.

Many purchases do not come with digital receipts or users may simply prefer entering expenses manually.

Provide two methods of adding expenses.

A. MANUAL EXPENSE ENTRY

Create a simple Add Expense form.

Fields:

Expense name.
Amount.
Category.
Date.
Payment method.
Optional notes.
Allow users to save an expense without uploading a receipt.

Provide an easy category selection system.

B. SMART EXPENSE ENTRY

Allow users to enter an expense in natural language.

Example:
“Bought groceries for Rs. 2500 today.”

Use AI to suggest:

Expense name.
Amount.
Category.
Date.
Allow users to review and confirm before saving.

C. EXPENSE MANAGEMENT

Users must be able to:

View all expenses.
Search expenses.
Filter by category.
Filter by date.
Edit transactions.
Delete transactions.
View expense history.
Manual and bill-scanned expenses must appear in the same expense history.

Prevent duplicate expense entries.

6. SMART BILL SCANNER
Create a separate Bill Scanner feature.

Users can:

Upload bill images.
Capture photos using their camera.
Upload PDF receipts.
Use OCR to extract:

Store name.
Purchase date.
Individual product names.
Product quantities.
Unit prices.
Discounts.
Taxes where available.
Total bill amount.
Use AI to categorize the extracted products into:

Grocery.
Cleaning products.
Personal care.
Kitchen essentials.
Home appliances.
Clothing.
Household maintenance.
Other categories.
IMPORTANT WORKFLOW:

User uploads a bill.
OCR reads the bill.
AI extracts individual items.
Application suggests relevant categories.
User reviews extracted details.
User can correct incorrect information.
User confirms the bill.
Application saves the bill and creates corresponding expense records.
Dashboard budget and category totals update.
Do not save unconfirmed OCR data as final expenses.

Provide a manual correction option because OCR can make mistakes.

7. DIGITAL BILL WALLET
Create a separate My Bills section.

Every confirmed uploaded bill should be stored securely.

Display:

Original bill image.
Store name.
Date.
Total amount.
Extracted items.
Expense category.
Allow users to:

View previous bills.
Search bills.
Filter by date.
Filter by store.
Open original images.
Download bills.
Delete bills.
Store private bills using secure Supabase Storage policies.

Users must only access their own bills.

Manual expenses must also be supported without a bill attachment.

8. SMART AFFORDABLE PRODUCT ALTERNATIVES
This is an important unique feature.

HomeWise should analyze confirmed bill items and suggest affordable alternatives when suitable products are available.

Example:

If a user purchases an expensive detergent, shampoo, cleaning product, kitchen product, or household item, suggest comparable affordable alternatives.

Show:

Current product.
Current price.
Suggested alternative.
Alternative brand.
Alternative price.
Estimated savings.
Quality comparison.
Important features.
Product source.
Retailer link.
Do not recommend products solely because they are cheaper.

Consider quality, ingredients, materials, performance, warranty, energy efficiency, and genuine user reviews where relevant.

Never invent product prices, discounts, product quality claims, or availability.

Allow users to:

Save recommendations.
Dismiss recommendations.
Ignore suggestions.
View more alternatives.
9. SMART SHOPPING DISCOVERY – NOT A SHOPPING SITE
Create a simple discovery section with the following areas:

Recommended for Your Home.
Deals of the Week.
Better Alternatives.
Affordable Home Essentials.
Nearby Shops.
Product categories:

Clothing.
Home appliances.
Kitchen accessories.
Bathroom fixtures.
Taps and fittings.
Cleaning products.
Furniture.
Home decor.
Grocery products.
Household essentials.
Allow users to search for products and view relevant recommendations.

Use location permission or manually entered city to find nearby shops when supported.

Show:

Product image.
Brand.
Price.
Alternative price.
Shop name.
Location.
Source link.
Verified offer status.
Use legitimate external APIs or permitted data sources.

If real data APIs are not available, use clearly labeled sample data.

Do not present demo offers as real discounts.

The application must not contain:

Shopping cart.
Checkout.
Payment processing.
Seller accounts.
Product selling functionality.
This section should feel like a personal recommendation assistant, not an advertising website.

Sponsored recommendations, if ever introduced, must be clearly labeled.

10. GROCERY LIST MANAGEMENT
Create a dedicated Grocery List.

Each item should have:

Item name.
Quantity.
Estimated price.
Priority.
Purchased status.
Features:

Add items.
Edit items.
Delete items.
Mark purchased.
View pending items.
Calculate estimated total.
Calculate actual total.
Allow purchased items to be recorded as expenses without creating duplicate transactions.

11. HOUSEHOLD INVENTORY
Create a Home Inventory section.

Categories:

Kitchen.
Cleaning.
Bathroom.
Laundry.
Appliances.
Furniture.
Home maintenance.
Other essentials.
Allow users to record:

Item name.
Quantity.
Purchase date.
Price.
Notes.
Stock status.
Provide low-stock reminders and an option to add items to the grocery list.

12. SMART SAVING TIPS
Create a dedicated Smart Saving Tips section.

Include:

Grocery saving tips.
Electricity saving tips.
Water saving tips.
Kitchen management.
Cleaning alternatives.
DIY home solutions.
Affordable home organization.
Budget-friendly shopping.
Provide practical, actionable advice.

Allow users to bookmark useful tips.

13. REPORTS – USER CONTROLLED
Create a dedicated Reports section.

IMPORTANT USER EXPERIENCE REQUIREMENT:

Reports must NEVER automatically open.

Do not force users to view reports.

Do not display automatic report pop-ups.

Do not redirect users to reports after adding an expense.

Do not interrupt normal application usage with charts or analytics.

Instead:

Add a clearly labeled Reports tab in the sidebar.
Users can open reports whenever they want.
Keep a small optional summary on the dashboard.
Detailed reports should only load when users open the Reports section.
Weekly reports:

Total weekly expenses.
Category-wise spending.
Highest spending category.
Comparison with the previous week.
Weekly savings.
Monthly reports:

Total monthly budget.
Total expenses.
Remaining balance.
Savings.
Emergency fund.
Category-wise analysis.
Budget utilization.
Use clean charts and simple explanations.

Users should be able to choose the date range.

14. ADDITIONAL FEATURES
Add useful household management features:

Monthly bill tracking.
Electricity, gas, water, and internet bill records.
Bill due-date reminders.
Recurring expenses.
Weekly meal planning.
Budget alerts.
Personalized saving insights.
Keep advanced features separate so the main dashboard remains simple.

15. USER AUTHENTICATION AND DATABASE
Use Supabase.

Implement:

User registration.
Login.
Logout.
User profile.
Expense records.
Monthly budgets.
Custom categories.
Savings goals.
Emergency funds.
Uploaded bills.
Extracted bill items.
Grocery lists.
Household inventory.
Saved recommendations.
User preferences.
Create proper database relationships.

Implement Row Level Security.

Ensure that each user can only access their own financial records and uploaded documents.

Include SQL migrations and setup instructions.

16. APPLICATION NAVIGATION
Use these main sidebar sections:

Dashboard
My Budget
Expenses
Scan a Bill
My Bills
Savings & Emergency
Grocery List
Home Inventory
Smart Saving Tips
Smart Recommendations
Reports
Settings
Keep navigation simple and consistent.

17. SETTINGS
Provide settings for:

User profile.
Currency.
Location.
Budget preferences.
Notification preferences.
Privacy.
Account management.
Default currency: PKR.

Allow users to change currency.

Location should be optional and user-controlled.

18. TESTING AND QUALITY ASSURANCE
This must be a real functional application, not just a frontend design.

Test every major feature.

Test:

Registration and login.
Dashboard calculations.
Manual expense entry.
Natural language expense entry.
Budget creation and editing.
Category management.
Bill scanning.
OCR extraction.
Bill correction.
Bill storage.
Expense categorization.
Grocery management.
Inventory management.
Saving recommendations.
Weekly reports.
Monthly reports.
Responsive layouts.
Database security.
Fix errors before marking a feature complete.

Run TypeScript checks and production builds.

Do not leave non-functional buttons or placeholder navigation.

19. GITHUB AND DOCUMENTATION
Prepare the project for GitHub.

Create:

README.md.
Professional project description.
Features list.
Technology stack.
Installation instructions.
Environment variable example.
Database setup instructions.
Testing instructions.
Screenshots section.
.gitignore.
Never upload secrets or private financial data.

20. DEVELOPMENT INSTRUCTIONS
IMPORTANT: Do not attempt to generate the entire application in one uncontrolled step.

Follow these phases:

Phase 1: Inspect workspace and prepare project architecture.

Phase 2: Create frontend layout, sidebar, theme, and dashboard.

Phase 3: Implement authentication and database.

Phase 4: Implement budget management and manual expense tracking.

Phase 5: Implement bill scanning, OCR, and digital bill storage.

Phase 6: Implement savings and emergency funds.

Phase 7: Implement grocery lists and home inventory.

Phase 8: Implement affordable alternatives and smart recommendations.

Phase 9: Implement reports and saving tips.

Phase 10: Perform complete testing, fix bugs, and prepare GitHub documentation.

After each phase:

Explain completed work.
List created and modified files.
Explain how to run the application.
Identify any required external configuration.
Test the implemented features before proceeding.
Do not claim features are complete unless they have been implemented and tested.

FIRST TASK:

Inspect the current workspace, explain the development plan, propose the folder structure, and identify all required dependencies.

Do not overwrite existing files without checking them.

Build HomeWise as a professional, secure, easy-to-use household budget and money-saving assistant.

---

## PHASE 10 — IMPLEMENTATION CHECKLIST (2026-11-18)

Canonical matrix: `docs/SPEC-checklist.md` (done / partial / skipped).

| Area | Status |
|------|--------|
| Product identity (not e-commerce) | done |
| UI/UX responsive shell | done |
| Dashboard | done |
| Budget + categories | done |
| Budget push/email alerts | partial |
| Manual expenses | done |
| NL expenses (Gemini) | done |
| Optional bill OCR + My Bills | done |
| Savings & emergency | done |
| Grocery (no duplicate expense) | done |
| Inventory | done |
| Reports (never auto-open) | done |
| Saving tips + bookmarks | done |
| AI personalized tips | done |
| Live Recommendations (OSM / optional Google) | partial (no deal/price claims) |
| Auth email/password only | done |
| Settings profile / PKR / location | done |
| Notification/privacy preference panels | partial |
| Currency threaded through all UI | partial |
| RLS + private bill storage | done |
| README / env example / no secrets | done |
| Automated E2E test suite | skipped (manual + tsc/lint/build) |
| Social login / magic link | skipped |
| Cart / checkout / invented prices | skipped |