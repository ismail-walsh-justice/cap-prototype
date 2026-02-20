import { Router } from 'express';
import { body, validationResult } from 'express-validator';

import { PerChildDesignMode } from '../@types/session';
import paths from '../constants/paths';

/**
 * Routes for managing per-child design mode toggle and Design 2 functionality
 */
const perChildDesignRoutes = (router: Router) => {
  /**
   * POST: Toggle between Design 1 (inline per-child) and Design 2 (task list level)
   */
  router.post(paths.TOGGLE_DESIGN_MODE, (request, response) => {
    const newMode = request.body.designMode as PerChildDesignMode;

    if (!['design1', 'design2', 'design3', 'design4'].includes(newMode)) {
      return response.redirect(paths.TASK_LIST);
    }

    request.session.perChildDesignMode = newMode;

    // If switching to Design 2, initialize child plans if needed
    if (newMode === 'design2' && request.session.numberOfChildren > 0) {
      initializeChildPlans(request);
    }

    return response.redirect(paths.TASK_LIST);
  });

  /**
   * POST: Select which child's plan to edit (Design 2)
   */
  router.post(
    paths.SELECT_CHILD,
    body('childIndex').isInt({ min: 0 }).toInt(),
    (request, response) => {
      const errors = validationResult(request);
      if (!errors.isEmpty()) {
        return response.redirect(paths.TASK_LIST);
      }

      const childIndex = parseInt(request.body.childIndex, 10);

      // Validate child index is within range
      if (childIndex >= request.session.numberOfChildren) {
        return response.redirect(paths.TASK_LIST);
      }

      request.session.currentChildIndex = childIndex;

      // Ensure child plan exists
      initializeChildPlans(request);

      return response.redirect(paths.TASK_LIST);
    },
  );

  /**
   * POST: Copy a child's plan to another child (Design 2)
   */
  router.post(
    paths.COPY_CHILD_PLAN,
    body('sourceChildIndex').isInt({ min: 0 }).toInt(),
    body('targetChildIndex').isInt({ min: 0 }).toInt(),
    (request, response) => {
      const errors = validationResult(request);
      if (!errors.isEmpty()) {
        return response.redirect(paths.TASK_LIST);
      }

      const sourceIndex = parseInt(request.body.sourceChildIndex, 10);
      const targetIndex = parseInt(request.body.targetChildIndex, 10);

      // Validate indices
      if (
        sourceIndex >= request.session.numberOfChildren ||
        targetIndex >= request.session.numberOfChildren ||
        sourceIndex === targetIndex
      ) {
        return response.redirect(paths.TASK_LIST);
      }

      // Ensure child plans exist
      initializeChildPlans(request);

      const { childPlans, namesOfChildren } = request.session;
      const sourcePlan = childPlans?.find((p) => p.childIndex === sourceIndex);

      if (sourcePlan && childPlans) {
        // Find or create target plan
        let targetPlan = childPlans.find((p) => p.childIndex === targetIndex);
        if (!targetPlan) {
          targetPlan = {
            childIndex: targetIndex,
            childName: namesOfChildren[targetIndex],
            isComplete: false,
          };
          childPlans.push(targetPlan);
        }

        // Deep copy the plan data
        targetPlan.livingAndVisiting = JSON.parse(JSON.stringify(sourcePlan.livingAndVisiting || {}));
        targetPlan.handoverAndHolidays = JSON.parse(JSON.stringify(sourcePlan.handoverAndHolidays || {}));
        targetPlan.specialDays = JSON.parse(JSON.stringify(sourcePlan.specialDays || {}));
        targetPlan.otherThings = JSON.parse(JSON.stringify(sourcePlan.otherThings || {}));
        targetPlan.decisionMaking = JSON.parse(JSON.stringify(sourcePlan.decisionMaking || {}));
        targetPlan.copiedFromChildIndex = sourceIndex;
        targetPlan.isComplete = sourcePlan.isComplete;

        request.session.childPlans = childPlans;
      }

      // Switch to the target child
      request.session.currentChildIndex = targetIndex;

      return response.redirect(paths.TASK_LIST);
    },
  );
};

/**
 * Helper to initialize child plans if they don't exist
 */
function initializeChildPlans(request: Express.Request) {
  const { numberOfChildren, namesOfChildren, childPlans } = request.session;

  if (!childPlans || childPlans.length === 0) {
    request.session.childPlans = [];
    for (let i = 0; i < numberOfChildren; i++) {
      request.session.childPlans.push({
        childIndex: i,
        childName: namesOfChildren[i],
        isComplete: false,
      });
    }
  }

  // Set current child index if not set
  if (request.session.currentChildIndex === undefined) {
    request.session.currentChildIndex = 0;
  }
}

export default perChildDesignRoutes;
