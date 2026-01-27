package com.cctrs.backend.model;

public enum ActivityType {
    TREE_PLANTATION("Tree Plantation"),
    PUBLIC_TRANSPORT("Public Transport Use"),
    RECYCLING("Recycling"),
    CLEANUP_DRIVE("Clean-up Drive"),
    COMPOSTING("Composting"),
    ENERGY_SAVING("Energy Saving"),
    WATER_SAVING("Water Saving"),
    AWARENESS("Awareness Activity");

    private final String displayName;

    ActivityType(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
