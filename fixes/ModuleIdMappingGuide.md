# Module ID Mapping Implementation Guide

This guide explains how to implement the module ID mapping fix to ensure resources and evaluations display correctly for all modules, including those accessed via numeric IDs like `/course/{courseId}/module/0`.

## The Problem

The application uses URLs with numeric module IDs (like `/course/{courseId}/module/0`), but our database standardization converts all module IDs to UUID-style IDs (like `module_1744492800000_abc123`). This mismatch causes resources and evaluations not to display correctly.

## The Solution

We've created a module ID mapping system that maintains backward compatibility with numeric module IDs while standardizing the database structure. This allows URLs like `/course/{courseId}/module/0` to still work correctly.

## Implementation Steps

### 1. Add Module ID Mapping Utility

Create a new file `src/utils/ModuleIdMappingFix.js` with the code from `fixes/ModuleIdMappingFix.js`. This utility:

- Creates a mapping between numeric IDs (0, 1, 2) and UUID-style IDs
- Provides functions to convert between the two ID formats
- Stores the mapping in the database for each course

### 2. Update Module Page Component

Update the `src/pages/ModulePage.jsx` component using the code from `fixes/ModulePageFix.jsx`. This:

- Uses the module ID mapping to resolve numeric IDs to UUID-style IDs
- Maintains backward compatibility with existing URLs
- Ensures resources and evaluations display correctly

### 3. Enhance Module Fetching

Create a new file `src/utils/FetchModuleDetailsFix.js` with the code from `fixes/FetchModuleDetailsFix.js`. This:

- Enhances the module fetching logic to handle both ID formats
- Provides fallback mechanisms if a mapping doesn't exist
- Ensures consistent module data structure

### 4. Update Database Migration Utility

Update the database migration utility to create module ID mappings when fixing courses:

```javascript
// In src/utils/DatabaseMigrationUtil.js
import { createModuleIdMapping } from "./ModuleIdMappingFix";

// After updating the course with fixed modules
await update(courseRef, { 
  modules: fixedModules,
  updatedAt: new Date().toISOString()
});

// Create module ID mapping for backward compatibility
await createModuleIdMapping(courseId, fixedModules);
```

## Testing the Fix

1. Run the database migration utility to fix all courses and create module ID mappings
2. Test accessing modules via numeric IDs (e.g., `/course/{courseId}/module/0`)
3. Verify that resources and evaluations display correctly
4. Test accessing modules via UUID-style IDs to ensure they also work

## Troubleshooting

If resources and evaluations still don't display correctly:

1. Check the browser console for errors
2. Verify that the module ID mapping was created correctly in the database
3. Ensure the module exists in the database with the correct structure
4. Check that resources and evaluations have the correct moduleId references

## Additional Notes

- This fix maintains backward compatibility with existing URLs
- All new modules will use UUID-style IDs
- The mapping is automatically created when fixing courses
- The fix handles both array and object formats for modules
