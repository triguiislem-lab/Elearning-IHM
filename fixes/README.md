# Fixes for Course Module Display Issues

This directory contains fixes for issues with course modules, resources, and evaluations not displaying correctly for students in the course details page.

## Problem Summary

Some courses display modules, resources, and evaluations correctly while others don't. The main issues are:

1. Inconsistent data structures (some courses use arrays for modules, others use objects)
2. Missing modules in some courses
3. Missing resources and evaluations in some modules
4. Inconsistent references between objects
5. Inconsistent module ID formats (some use numeric IDs like "0", "1", others use UUID-style IDs)

## Implementation Instructions

### 1. Fix Course Form Component

1. Open `src/components/admin/CourseForm.jsx`
2. Find the section that handles module structure conversion in the `handleSubmit` function
3. Replace it with the improved version from `fixes/CourseFormFix.jsx`
4. Add the validation function `validateModuleStructure` from `fixes/CourseFormFix.jsx`
5. Add the normalization function `normalizeModuleData` from `fixes/CourseFormFix.jsx`
6. Call `validateModuleStructure` before saving the course to ensure proper structure

### 2. Fix Resource Creation

1. Open `src/components/admin/ModuleManagerCreation.jsx`
2. Find the `handleAddResource` function
3. Replace it with the improved version from `fixes/ResourceCreationFix.jsx`

### 3. Fix Evaluation Creation

1. Open `src/components/admin/ModuleManagerCreation.jsx`
2. Find the `handleAddEvaluation` and `handleAddQuestion` functions
3. Replace them with the improved versions from `fixes/EvaluationCreationFix.jsx`

### 4. Fix Module Content Display

1. Open `src/components/courses/ModuleContent.jsx`
2. Add the normalization functions `normalizeResources` and `normalizeEvaluations` from `fixes/ModuleContentFix.jsx`
3. Add the validation function `validateModuleData` from `fixes/ModuleContentFix.jsx`
4. Update the component to use these functions to ensure consistent data structure

### 5. Add Database Migration Utility

1. Create a new file `src/utils/DatabaseMigrationUtil.js`
2. Copy the content from `fixes/DatabaseMigrationUtil.js`
3. This utility will be used by the Course Fixer component

### 6. Add Course Fixer Component

1. Create a new file `src/components/admin/CourseFixerComponent.jsx`
2. Copy the content from `fixes/CourseFixerComponent.jsx`
3. This component will allow administrators to fix course structures

### 7. Add Admin Route for Course Fixer

1. Create a new file `src/pages/admin/course-fixer.jsx`
2. Copy the content from `fixes/AdminCourseFixer.jsx`
3. Add the route to `src/App.jsx` or your routing configuration:

```jsx
<Route path="/admin/course-fixer" element={<AdminCourseFixer />} />
```

4. Add a link to the admin dashboard:

```jsx
<Link to="/admin/course-fixer" className="...">
  Outil de correction des cours
</Link>
```

### 8. Standardize Module IDs with Backward Compatibility

1. Create a new file `src/utils/ModuleIdFix.js`
2. Copy the content from `fixes/ModuleIdFix.js`
3. Create a new file `src/utils/ModuleIdMappingFix.js`
4. Copy the content from `fixes/ModuleIdMappingFix.js`
5. Update the module creation in `src/components/admin/ModuleManagerCreation.jsx` using the code from `fixes/ModuleCreationFix.jsx`
6. Update the `src/pages/ModulePage.jsx` component using the code from `fixes/ModulePageFix.jsx`
7. Create a new file `src/utils/FetchModuleDetailsFix.js`
8. Copy the content from `fixes/FetchModuleDetailsFix.js`
9. This ensures all modules use UUID-style IDs while maintaining backward compatibility with numeric IDs in URLs

### 9. Fix Existing Courses

1. Navigate to the new Course Fixer page in the admin dashboard
2. Use the "Fix All Courses" button to automatically fix all courses
3. If any courses fail to be fixed, use the individual "Fix" buttons to fix them one by one
4. This will standardize all module IDs and fix references between modules, resources, and evaluations

## Testing

After implementing these fixes:

1. Create a new course with modules, resources, and evaluations
2. Verify that the modules, resources, and evaluations are displayed correctly for students
3. Check existing courses to ensure they now display correctly
4. Test as both instructor and student to verify proper access

## Additional Notes

- The fixes ensure that all courses follow a consistent data structure
- Resources are always stored as arrays
- Evaluations are always stored as objects
- All required fields are present and properly formatted
- References between objects are consistent
- Module IDs are standardized to use UUID-style IDs (like `module_1744492800000_abc123`) instead of numeric IDs (like `0`, `1`, `2`)
- A mapping between numeric IDs and UUID-style IDs is maintained for backward compatibility
- URLs like `/course/{courseId}/module/0` will still work, but will internally use the UUID-style ID
- All references to moduleId in resources and evaluations are updated to match the new module IDs

If you encounter any issues during implementation, please refer to the fixed JSON files for examples of properly structured courses.
