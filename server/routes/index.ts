import { Router } from 'express';

import config from '../config';
import FORM_STEPS from '../constants/formSteps';
import paths from '../constants/paths';
import addCompletedStep from '../utils/addCompletedStep';

import aboutTheAdultsRoutes from './aboutTheAdults';
import aboutTheChildrenRoutes from './aboutTheChildren';
import accessibilityStatementRoutes from './accessibilityStatement';
import analyticsRoutes from './analytics';
import checkYourAnswersRoutes from './checkYourAnswers';
import childrenSafetyRoutesCheck from './childrenSafetyCheck';
import confirmationRoutes from './confirmation';
import courtOrderCheckRoutes from './courtOrderCheck';
import decisionMakingRoutes from './decisionMaking';
import doWhatsBestRoutes from './doWhatsBest';
import downloadRoutes from './downloads';
import existingCourtOrderRoutes from './existingCourtOrder';
import handoverAndHolidaysRoutes from './handoverAndHolidays';
import livingAndVisitingRoutes from './livingAndVisiting';
import numberOfChildrenRoutes from './numberOfChildren';
import otherThingsRoutes from './otherThings';
import perChildDesignRoutes from './perChildDesign';
import safetyCheckRoutes from './safetyCheck';
import sharePlanRoutes from './sharePlan';
import specialDaysRoutes from './specialDays';
import taskListRoutes from './taskList';


const routes = (): Router => {
  const router = Router();

  // GET start page
  router.get(paths.START, (request, response) => {
    // In production (live service), skip the start page and redirect to safety check
    if (config.isLiveService) {
      return response.redirect(paths.SAFETY_CHECK);
    }
    addCompletedStep(request, FORM_STEPS.START);
    const { usePerChildPoC, perChildDesignMode } = request.session;
    let currentDesignMode = 'current';
    if (usePerChildPoC) {
      currentDesignMode = perChildDesignMode || 'design1';
    }
    response.render('pages/index', {
      showUrToggle: true,
      usePerChildPoC: usePerChildPoC || false,
      currentDesignMode,
    });
  });

  // POST start page - handle service version selection
  router.post(paths.START, (request, response) => {
    const { serviceVersion } = request.body;

    // Map service version to session flags
    const validDesigns = ['current', 'design1', 'design2', 'design3', 'design4', 'poc'];
    const design = validDesigns.includes(serviceVersion) ? serviceVersion : 'current';
    const newUsePerChildPoC = design !== 'current';
    const newDesignMode = design !== 'current' && design !== 'poc' ? design : (design === 'poc' ? 'design1' : undefined);

    // Clear session data when starting fresh, but preserve session ID to keep CSRF token valid
    delete request.session.numberOfChildren;
    delete request.session.namesOfChildren;
    delete request.session.initialAdultName;
    delete request.session.secondaryAdultName;
    delete request.session.perChildDesignMode;
    delete request.session.currentChildIndex;
    delete request.session.childPlans;
    delete request.session.livingAndVisiting;
    delete request.session.handoverAndHolidays;
    delete request.session.specialDays;
    delete request.session.otherThings;
    delete request.session.decisionMaking;

    // Set the new service version and initialize completedSteps with START
    request.session.usePerChildPoC = newUsePerChildPoC;
    if (newDesignMode) {
      request.session.perChildDesignMode = newDesignMode as any;
    }
    request.session.completedSteps = [FORM_STEPS.START];
    request.session.planStartTime = Date.now();
    response.redirect(paths.SAFETY_CHECK);
  });

  analyticsRoutes(router);
  safetyCheckRoutes(router);
  childrenSafetyRoutesCheck(router);
  doWhatsBestRoutes(router);
  courtOrderCheckRoutes(router);
  existingCourtOrderRoutes(router);
  numberOfChildrenRoutes(router);
  aboutTheChildrenRoutes(router);
  aboutTheAdultsRoutes(router);
  taskListRoutes(router);
  checkYourAnswersRoutes(router);
  sharePlanRoutes(router);
  confirmationRoutes(router);
  livingAndVisitingRoutes(router);
  handoverAndHolidaysRoutes(router);
  specialDaysRoutes(router);
  otherThingsRoutes(router);
  decisionMakingRoutes(router);
  downloadRoutes(router);
  accessibilityStatementRoutes(router);
  perChildDesignRoutes(router);

  return router;
};

export default routes;
