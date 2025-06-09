# Manual Testing Checklist for Location Integration & Multi-API Service

This checklist outlines manual testing steps to ensure the new location-based features and multi-API integration in `PlacesService.js` work as expected.

## 1. Location Permissions

*   **[ ] Initial Permission Request:**
    *   On a fresh install (or after clearing app data), verify that the app requests location permission upon first launch or when the Home Screen is first loaded.
    *   _Expected:_ A system permission dialog for location access should appear.
*   **[ ] Denying Permission:**
    *   When the permission dialog appears, select "Deny" (or the equivalent).
    *   Navigate to the Home Screen.
    *   _Expected:_ The app should handle this gracefully. Popular places shown should be general (not location-specific). The app should not crash. Search and recommendations should also fall back to non-location-aware results.
*   **[ ] Granting Permission:**
    *   When the permission dialog appears, select "Allow" (or "Allow while using app").
    *   Navigate to the Home Screen.
    *   _Expected:_ Popular places should be relevant to the device's current physical location. Subsequent searches and recommendations should also use this location.
*   **[ ] Granting Permission (After Initial Denial):**
    *   If permission was initially denied, go to app settings, manually grant location permission for the app.
    *   Re-open the app and navigate to the Home Screen.
    *   _Expected:_ The app should now detect the granted permission. Popular places should become location-specific. `userLocation` and `locationPermissionGranted` in `PlacesContext` should update, triggering relevant data fetches.
*   **[ ] Revoking Permission:**
    *   Grant location permission and use the app to see location-specific results.
    *   Go to app settings and revoke location permission for the app.
    *   Return to the app (it might restart or resume). Navigate to the Home Screen or Recommendation Screen.
    *   _Expected:_ The app should detect the permission change. Popular places, search results, and recommendations should revert to general, non-location-specific data. The app should not crash.

## 2. Home Screen - Popular Places & Search

*   **[ ] Popular Places - Location Granted:**
    *   Ensure location permission is granted and location services are enabled on the device.
    *   Open the Home Screen.
    *   _Expected:_ The list of popular places should be relevant to the current physical location of the device. (e.g., nearby landmarks, restaurants).
*   **[ ] Popular Places - Location Denied/Unavailable:**
    *   Deny location permission or disable location services on the device.
    *   Open the Home Screen.
    *   _Expected:_ The app should display general popular places, not specific to any particular location.
*   **[ ] Search - With Location:**
    *   Ensure location permission is granted.
    *   Perform a search for a generic term (e.g., "coffee," "park").
    *   _Expected:_ Search results should be biased towards the current location (e.g., coffee shops near you).
*   **[ ] Search - Without Location:**
    *   Deny location permission.
    *   Perform the same search (e.g., "coffee," "park").
    *   _Expected:_ Search results should be general and not specific to any location.
*   **[ ] Search - Specific Location Query:**
    *   Deny location permission.
    *   Perform a search that includes a location name (e.g., "coffee in London").
    *   _Expected:_ Results should be relevant to "London", even without device location permission.

## 3. Mood-Based Recommendations

*   **[ ] Recommendations - Location Granted:**
    *   Ensure location permission is granted.
    *   Select a mood (e.g., "Relaxed") from the Mood Selection Screen.
    *   Navigate to the Recommendation Screen.
    *   _Expected:_ Recommendations should be relevant to the selected mood AND the current physical location (e.g., parks or quiet cafes near you for "Relaxed").
*   **[ ] Recommendations - Location Denied/Unavailable:**
    *   Deny location permission.
    *   Select the same mood.
    *   Navigate to the Recommendation Screen.
    *   _Expected:_ Recommendations should be relevant to the selected mood but general, not tied to a specific location (e.g., general types of places considered "Relaxed").
*   **[ ] Test with Different Moods:**
    *   Repeat the above two tests (with and without location) for a variety of moods (e.g., "Adventurous," "Hungry," "Creative").
    *   _Expected:_ Results should consistently reflect the mood and location status.

## 4. API Integration (Advanced)

*   **[ ] Verify Service Usage (Requires Code Modification for Clear Visibility):**
    *   _(Optional - for developers/testers with code access)_ Temporarily modify `PlacesService.js` in the `searchPlaces` and `getRecommendationsByMood` functions. Before `_deDuplicatePlaces` is called, log the source of each place (e.g., add a `source: 'Foursquare'` or `source: 'Geoapify'` property to each place object when it's fetched and formatted).
    *   Perform searches and request mood-based recommendations.
    *   Check the console logs.
    *   _Expected (with logging):_ Logs should show places coming from Foursquare, Geoapify, and OpenCageData (for `searchPlaces`). Deduplication should be observable if multiple services return the same place. For `getPopularPlaces` (with location) and `getRecommendationsByMood` (with location), Geoapify results should be visible.
*   **[ ] Deduplication Check (Indirect UI Observation):**
    *   Search for a very common and specific landmark that is likely to be in all databases (e.g., "Eiffel Tower").
    *   Examine the results list carefully.
    *   _Expected:_ The landmark should ideally appear only once, or if multiple entries exist, they should have distinct details (e.g., one is a general point, another a specific tour associated with it). This is an indirect check and might be hard to confirm without logs.
*   **[ ] API Failure Simulation (Difficult to test manually without tools):**
    *   This typically requires network interception tools (e.g., Charles, Fiddler) to block requests to one of the APIs (Foursquare, Geoapify, or OpenCageData).
    *   If an API is blocked:
        *   Perform a search or request recommendations.
        *   _Expected:_ The app should not crash. It should ideally return results from the other available APIs. If all fail, it should show an appropriate message or an empty state.

## 5. General App Stability & Edge Cases

*   **[ ] Navigation:**
    *   Navigate extensively through all screens of the app (Home, Search, Place Detail, Mood Selection, Recommendations, Profile, etc.).
    *   _Expected:_ Smooth transitions, no crashes, UI elements correctly displayed.
*   **[ ] No Internet Connection:**
    *   Disable Wi-Fi and mobile data on the device.
    *   Launch the app and attempt to fetch popular places, search, or get recommendations.
    *   _Expected:_ The app should handle the lack of internet gracefully. This might mean showing cached data (if implemented), a "No Internet" message, or an empty state with a prompt to check connection. Avoid crashes.
*   **[ ] Slow Internet Connection:**
    *   If possible, simulate a slow network connection (e.g., using network throttling tools in browser developer tools if testing a web version, or specific apps for mobile).
    *   Perform data-fetching operations.
    *   _Expected:_ Loading indicators should be present. The app should remain responsive. Data should eventually load, or a timeout message should appear if requests take too long.
*   **[ ] UI Consistency:**
    *   Check for consistent UI elements, fonts, colors, and layouts across different screens.
    *   Test on different device screen sizes and orientations (if supported).
    *   _Expected:_ A polished and consistent user experience. No major UI bugs like overlapping text or buttons.
*   **[ ] Input Handling:**
    *   Test search input with various characters, lengths, and empty states.
    *   _Expected:_ No crashes or unexpected behavior.
*   **[ ] Repeated Actions:**
    *   Quickly tap buttons multiple times or trigger navigation events repeatedly.
    *   _Expected:_ App should handle this without crashing or entering a strange state. Loading states should prevent redundant calls.

This checklist provides a comprehensive set of manual tests. Depending on the available tools and time, some tests (especially deep API integration and network conditions) might be more challenging to perform exhaustively.
