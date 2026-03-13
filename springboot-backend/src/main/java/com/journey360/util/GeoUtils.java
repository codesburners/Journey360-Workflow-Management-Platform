package com.journey360.util;

/**
 * Geo utility functions — ported from utils/geo.py
 */
public final class GeoUtils {

    private GeoUtils() {
    }

    /**
     * Calculate the great circle distance between two points (in meters).
     */
    public static double haversine(double lat1, double lon1, double lat2, double lon2) {
        double r = 6371000; // Earth's radius in meters

        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);

        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                        * Math.sin(dLon / 2) * Math.sin(dLon / 2);

        double c = 2 * Math.asin(Math.sqrt(a));
        return c * r;
    }

    /**
     * Calculates the bearing between two points in degrees.
     */
    public static double calculateBearing(double lat1, double lon1, double lat2, double lon2) {
        double lat1r = Math.toRadians(lat1);
        double lat2r = Math.toRadians(lat2);
        double dLon = Math.toRadians(lon2 - lon1);

        double y = Math.sin(dLon) * Math.cos(lat2r);
        double x = Math.cos(lat1r) * Math.sin(lat2r)
                - Math.sin(lat1r) * Math.cos(lat2r) * Math.cos(dLon);

        double bearing = Math.toDegrees(Math.atan2(y, x));
        return (bearing + 360) % 360;
    }
}
