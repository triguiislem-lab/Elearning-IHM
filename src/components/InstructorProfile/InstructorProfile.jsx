import React from "react";
import OptimizedLoadingSpinner from "../Common/OptimizedLoadingSpinner";

// ... existing code ...

if (loading) {
  return (
    <div className="flex justify-center items-center h-40">
      <OptimizedLoadingSpinner size="medium" text="Chargement du profil..." />
    </div>
  );
}

// ... rest of the existing code ...
