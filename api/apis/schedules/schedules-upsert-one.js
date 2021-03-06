// eslint-disable-next-line no-global-assign
Promise = require(`bluebird`);

const _ = require(`lodash`);
const path = require(`path`);

/***********************************
 * Initialize API Builder
 ***********************************/
const ApiBuilder = require(`@axway/api-builder-runtime`);
const { app } = ApiBuilder.getGlobal();

/***********************************
 * Initialize Logging
 ***********************************/
const filename = __filename.substring(path.join(__dirname, `..`).length);
const logger = new app.locals.Logger({ filename });
logger.trace(`module initialization: ${filename}`);


/***********************************
 * Initialize Managers
 ***********************************/
const ApiManager = require(`../../lib/ApiManager`);
const ErrorManager = require(`../../lib/ErrorManager`);
const OperationManager = require(`../../lib/OperationManager`);

/***********************************
 * Initialize Instances
 ***********************************/
const api = new ApiManager();

/***********************************
 * Configure API
 ***********************************/

const operationMetadata = {
	group:       `schedules`,
	name:        `put-schedule`,
	path:        `/api/v1/schedules/:schedule_id`,
	method:      `PUT`,
	description: `Upserts a schedule based on the ID supplied.  Will replace schedule, if it already exists otherwise it will insert a new schedule.`,
	parameters:  {
		schedule_id:       { description: `ID of the schedule to update`, type: `query`, optional: false  },
		id:                { description: `Unique ID for this entity (across environments)`, type: `body`, optional: false  },
		office_id:         { description: `Entity ID of the office this capacity is for`, type: `body`, optional: false  },
		employee_id:       { description: `Entity ID of the employee scheduling to be in office`, type: `body`, optional: false  },
		day:               { description: `Day that user is scheduled to be in the selected office.  (in format YYYYDDD)`, type: `body`, optional: false  },
		start_time:        { description: `start_time`, type: `body`, optional: true  },
		end_time:          { description: `end_time`, type: `body`, optional: true  },
		object_created_at: { description: `Autogenerated timestamp when DB field created`, type: `body`, optional: true  },
		object_updated_at: { description: `Autogenerated timestamp when DB field updated`, type: `body`, optional: true  },
		entity_created_at: { description: `entity_created_at`, type: `body`, optional: true  },
		entity_updated_at: { description: `entity_updated_at`, type: `body`, optional: true  },
		object_id:         { description: `Autogenerated Object ID for this entity`, type: `body`, optional: true  },
	},
	scopes:             [ `write:schedules` ],
	modelName:          `Schedule`,
	actionName:         `upsert-one`,
	wildcardParameters: true,
};

module.exports = ApiBuilder.API.extend(
	Object.assign(operationMetadata, {
		async action (req, resp, next) {
			console.error(`******************************************************************************`);
			logger.entering(`operation: ${operationMetadata.name}`);

			try {

				const operationManager = new OperationManager({
					operationId: operationMetadata.operationId,
					metadata:    operationMetadata,
					logger,
					request:     req,
					response:    resp,
					next,
					api,
				});

				await operationManager.validateRequest();

				const { schedule_id, office_id, employee_id, day, start_time, end_time, entity_created_at, entity_updated_at  } = req.params;

				const result = await api.schedules.upsertByEntityId({
					office_id,
					employee_id,
					day,
					start_time,
					end_time,
					entity_created_at,
					entity_updated_at,
				},
				schedule_id,
				);

				// console.debug(`🦠  put-schedule result: ${JSON.stringify(result, null, 2)}`);

				const response = {
					success: true,
					meta:    result.meta,
					results: result.results,
				};

				await operationManager.validateResponse(response);

				logger.debug({ message: `success response`, body: response });
				resp.response.status(200);
				return resp.send(response, null, next);

			} catch (error) {
				logger.entering(`catch`);
				const errorResponse = ErrorManager.createErrorResponse(error, logger);
				logger.error({ message: `error response`, body: errorResponse });
				resp.response.status(errorResponse.meta.code);
				return resp.send(errorResponse, null, next);
			}
		},
	}));
