/* eslint-disable @typescript-eslint/no-explicit-any */
import { Router } from 'express';

import { ChildPlan } from '../@types/session';
import FORM_STEPS from '../constants/formSteps';
import paths from '../constants/paths';
import checkFormProgressFromConfig from '../middleware/checkFormProgressFromConfig';
import addCompletedStep from '../utils/addCompletedStep';
import {
  formattedChildrenNames,
  mostlyLiveComplete,
  getBetweenHouseholdsComplete,
  whereHandoverComplete,
  willChangeDuringSchoolHolidaysComplete,
  itemsForChangeoverComplete,
  whatWillHappenComplete,
  whatOtherThingsMatterComplete,
  planLastMinuteChangesComplete,
  planLongTermNoticeComplete,
  planReviewComplete,
} from '../utils/sessionHelpers';

/**
 * Check if a child plan is complete (Design 2)
 */
const isChildPlanComplete = (plan: ChildPlan | undefined): boolean => {
  if (!plan) return false;

  // Check all required sections
  const hasLivingAndVisiting = !!plan.livingAndVisiting?.mostlyLive;
  const hasHandover = !!plan.handoverAndHolidays?.getBetweenHouseholds;
  const hasWhereHandover = !!plan.handoverAndHolidays?.whereHandover;
  const hasSchoolHolidays =
    !!plan.handoverAndHolidays?.willChangeDuringSchoolHolidays ||
    !!plan.handoverAndHolidays?.howChangeDuringSchoolHolidays;
  const hasItems = !!plan.handoverAndHolidays?.itemsForChangeover;
  const hasSpecialDays = !!plan.specialDays?.whatWillHappen;
  const hasOtherThings = !!plan.otherThings?.whatOtherThingsMatter;
  const hasDecisionMaking =
    !!plan.decisionMaking?.planLastMinuteChanges &&
    !!plan.decisionMaking?.planLongTermNotice &&
    !!plan.decisionMaking?.planReview;

  return (
    hasLivingAndVisiting &&
    hasHandover &&
    hasWhereHandover &&
    hasSchoolHolidays &&
    hasItems &&
    hasSpecialDays &&
    hasOtherThings &&
    hasDecisionMaking
  );
};

const taskListRoutes = (router: Router) => {
  router.get(paths.TASK_LIST, checkFormProgressFromConfig(FORM_STEPS.TASK_LIST), (request, response) => {
    const { numberOfChildren, namesOfChildren, perChildDesignMode, currentChildIndex, childPlans } = request.session;

    // Determine which design mode we're in (default to design1)
    const designMode = perChildDesignMode || 'design1';
    const isDesign2Mode = designMode === 'design2' && numberOfChildren > 1;
    const isDesign3Mode = designMode === 'design3';
    const isDesign4Mode = designMode === 'design4';

    // Design 1: Check completion status from main session
    const isMostlyLiveComplete = mostlyLiveComplete(request.session);
    const isGetBetweenHouseholdsComplete = getBetweenHouseholdsComplete(request.session);
    const isWhereHandoverComplete = whereHandoverComplete(request.session);
    const isWillChangeDuringSchoolHolidaysComplete = willChangeDuringSchoolHolidaysComplete(request.session);
    const isItemsForChangeoverComplete = itemsForChangeoverComplete(request.session);
    const isWhatWillHappenComplete = whatWillHappenComplete(request.session);
    const isWhatOtherThingsMatterComplete = whatOtherThingsMatterComplete(request.session);
    const isPlanLastMinuteChangesComplete = planLastMinuteChangesComplete(request.session);
    const isPlanLongTermNoticeComplete = planLongTermNoticeComplete(request.session);
    const isPlanReviewComplete = planReviewComplete(request.session);

    addCompletedStep(request, FORM_STEPS.TASK_LIST);

    // Design 2 specific data
    let design2Data = {};
    if (isDesign2Mode) {
      // Initialize child plans if needed
      let plans = childPlans || [];
      if (plans.length === 0) {
        plans = namesOfChildren.map((name, index) => ({
          childIndex: index,
          childName: name,
          isComplete: false,
        }));
        request.session.childPlans = plans;
      }

      // Ensure current child index is valid
      const activeChildIndex =
        currentChildIndex !== undefined && currentChildIndex < numberOfChildren ? currentChildIndex : 0;
      if (request.session.currentChildIndex !== activeChildIndex) {
        request.session.currentChildIndex = activeChildIndex;
      }

      // Calculate completion status for each child
      const childPlanStatuses = plans.map((plan) => ({
        ...plan,
        isComplete: isChildPlanComplete(plan),
      }));

      // Get children that can be copied from (those with any data)
      const childrenWithData = plans.filter(
        (plan) =>
          plan.livingAndVisiting ||
          plan.handoverAndHolidays ||
          plan.specialDays ||
          plan.otherThings ||
          plan.decisionMaking,
      );

      design2Data = {
        isDesign2: true,
        currentChildIndex: activeChildIndex,
        currentChildName: namesOfChildren[activeChildIndex],
        childPlanStatuses,
        childrenWithData,
        allChildrenComplete: childPlanStatuses.every((p) => p.isComplete),
      };
    }

    // For Design 2, require all children to be complete
    const allTasksComplete =
      isWhatWillHappenComplete &&
      isMostlyLiveComplete &&
      isGetBetweenHouseholdsComplete &&
      isWhereHandoverComplete &&
      isWillChangeDuringSchoolHolidaysComplete &&
      isItemsForChangeoverComplete &&
      isWhatOtherThingsMatterComplete &&
      isPlanLastMinuteChangesComplete &&
      isPlanLongTermNoticeComplete &&
      isPlanReviewComplete;

    const showContinueButton = isDesign2Mode
      ? allTasksComplete && (design2Data as any).allChildrenComplete
      : allTasksComplete;

    response.render('pages/taskList', {
      title: request.__('taskList.title', { names: formattedChildrenNames(request) }),
      // Design mode toggle - hidden for now, keeping Design 1 as the default
      designMode,
      designModeLabel: designMode === 'design1' ? 'Design 1: Answer for all, then specify per child (dropdown)' :
                       designMode === 'design2' ? 'Design 2: Answer for each child separately' :
                       designMode === 'design3' ? 'Design 3: Answer once, then specify per child' :
                       designMode === 'design4' ? 'Design 4: Answer for all, then specify per child (checkboxes)' : null,
      showDesignToggle: false,
      numberOfChildren,
      namesOfChildren,
      // This should only be true when all tasks are complete
      showContinue: showContinueButton,
      mostlyLiveComplete: isMostlyLiveComplete,
      getBetweenHouseholdsComplete: isGetBetweenHouseholdsComplete,
      whereHandoverComplete: isWhereHandoverComplete,
      willChangeDuringSchoolHolidaysComplete: isWillChangeDuringSchoolHolidaysComplete,
      itemsForChangeoverComplete: isItemsForChangeoverComplete,
      whatWillHappenComplete: isWhatWillHappenComplete,
      whatOtherThingsMatterComplete: isWhatOtherThingsMatterComplete,
      planLastMinuteChangesComplete: isPlanLastMinuteChangesComplete,
      planLongTermNoticeComplete: isPlanLongTermNoticeComplete,
      planReviewComplete: isPlanReviewComplete,
      // Design 2 specific data
      ...design2Data,
    });
  });
};

export default taskListRoutes;
