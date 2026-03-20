# Triply Interactive Prototype

## Overview

Triply is a high-fidelity, multi-linear interactive travel planning application. It allows users to seamlessly move between discovering destinations, planning itineraries, and visualizing trips on an interactive map. Unlike a linear click-through, this prototype is function-complete, enabling robust user testing across varied paths.

## Design and Development Process: Figma to HTML

The user interface was meticulously crafted in Figma before being translated into a functional React application using Next.js.

- **Visual Design**: The design utilizes a premium glassmorphism aesthetic with a curated color palette (Navy #1D4983, Sky #53D8FB).
- **Design Tokens**: Every color, spacing, and typography choice from Figma was extracted and implemented as standard CSS variables in a Tailwind v4 environment (globals.css).
- **Component Architecture**: We used a component-based approach with Shadcn UI as a foundation, customizing every element to match the Figma mockups exactly.
- **Interactivity**: Smooth transitions and micro-animations were implemented using motion/react to mirror the intended feel of the Figma prototype.

## Multi-Linear Interactive System

The prototype is designed to simulate a real-world application where users are not restricted to a single path.

- **State Management**: Using React Context and LocalStorage, the application maintains a persistent system state. Users can sign up, sign in, and have their profile data persist across sessions.
- **Non-Linear Navigation**: The main menu is accessible from every page. A user can jump from the middle of a trip planning flow to their dashboard, or from the map view back to the home page without losing their state.
- **Function-Complete Core Path**:
  - **Authentication**: Full login, sign-up, and password recovery flows.
  - **Dashboard**: Personalized user header, trip statistics, and profile management.
  - **Trip Planning**: Dynamic itinerary builder where users can add and organize events.
  - **Interactive Map**: Real-time search and visualization of travel routes and markers.

## Response to Lab Feedback

During the development and desk critiques, several refinements were made based on feedback:

- **Itinerary Planning Clarity**: Based on feedback from instructor Paul that the initial planning flow was unclear, we redesigned the Hero section to function as a "Fast Planning" hub. This included consolidating destination, date, and traveler inputs into a single, intuitive interface that allows users to jump-start their itinerary immediately upon landing.
- **Visual Clarity**: Transport mode colors were adjusted (e.g., standardizing the 'drive' mode to a sky blue #4a98f7) to improve map readability.
- **User Experience**: The itinerary view was polished to ensure that adding and removing items feels intuitive and stable.
