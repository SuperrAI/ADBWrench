# Student Avatar Icons

This folder contains the custom SVG icons for student profile pictures.

## File Naming Convention

Name your SVG files using this pattern:
- `student-01.svg`
- `student-02.svg`
- `student-03.svg`
- ... up to `student-99.svg`

## Current Implementation

The system is currently configured to use **random mapping** by default.

This means:
- Each student gets a randomly-assigned icon based on their ID and name
- The same student will **always** get the same icon (deterministic)
- Icons are well-distributed across all students
- Icons are assigned from `student-01.svg` to `student-99.svg`

If a specific icon file is not found, the system will fall back to the DiceBear-generated avatar.

## Mapping Strategies

The system supports four mapping strategies:

### 1. Random (Default) ✅
Icons are randomly assigned based on student ID and name. Each student gets a unique, consistent icon.

### 2. Index-based
The first student in a list uses `student-01.svg`, the second uses `student-02.svg`, etc.

### 3. Name-based
Icons are mapped deterministically based on student's full name hash.

### 4. ID-based
Icons are named using the student's ID: `student-{id}.svg`

## Examples

To use index-based mapping, add your icons like this:
```
student-avatars/
  ├── student-01.svg
  ├── student-02.svg
  ├── student-03.svg
  └── student-04.svg
```

## Changing the Mapping Strategy

To change how icons are mapped, edit the `iconPath` prop in these files:
- `src/app/people/page.tsx` (around line 570 and 696)
- `src/app/people/[class_id]/page.tsx` (around line 228)

Change the third parameter of `getStudentAvatarPath()`:
- `'random'` - uses random mapping (current default) ✅
- `'index'` - uses index-based mapping
- `'name'` - uses name-based mapping (deterministic)
- `'id'` - uses student ID-based mapping

Example:
```typescript
// Current (random - default)
iconPath={getStudentAvatarPath(student, index, 'random')}

// To use index-based
iconPath={getStudentAvatarPath(student, index, 'index')}

// To use name-based
iconPath={getStudentAvatarPath(student, index, 'name')}
```

## How Random Mapping Works

The random mapping uses the student's ID, first name, and last name to generate a deterministic hash. This ensures:
- The same student always gets the same icon
- Different students get different icons (well-distributed)
- The assignment appears random but is reproducible

