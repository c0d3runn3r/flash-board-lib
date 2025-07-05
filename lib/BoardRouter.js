const express = require('express');
const Asset = require('./Asset');

/**
* @class BoardRouter
* @description A router class that exposes RESTful endpoints for interacting with a Board instance.
*              Provides a JSON:API compliant interface with HATEOAS links.
*/
class BoardRouter {
	#board;
	#router;
	#base_url;
	
	/**
	* Creates a new BoardRouter instance.
	* @param {Object} config - Configuration object for the router.
	* @param {Board} config.board - The Board instance to expose via the router.
	* @param {string} [config.base_url=''] - The base URL under which the router is mounted (e.g., '/api').
	* @throws {Error} If the board is not a valid Board instance.
	*/
	constructor(config = {}) {
		if (!config.board || config.board.constructor.name !== 'Board') {
			throw new Error('A valid Board instance must be provided to the BoardRouter constructor.');
		}
		
		this.#board = config.board;
		this.#base_url = config.base_url || '';
		this.#router = express.Router();
		
		// Bind routes
		this.#router.get('/board/', this.#get_board.bind(this));
		this.#router.get('/board/segment/:id', this.#get_segment.bind(this));
		this.#router.get('/board/segment/:id/element/:element_id', this.#get_element.bind(this));
		this.#router.get('/board/asset/:id', this.#get_asset.bind(this));
	}
	
	/**
	* Getter for the Express router instance.
	* @returns {express.Router} The Express router instance.
	*/
	get router() {
		return this.#router;
	}

	/**
	 * Handles GET /board/asset/:id request, returning the asset's information in JSON:API format.
	 * @param {express.Request} req - The Express request object.
	 * @param {express.Response} res - The Express response object.
	 * @param {express.NextFunction} next - The Express next function.
	 * @private
	*/
	#get_asset(req, res, next) {
		try {
			const asset_id = req.params.id;
			const [segment, asset] = this.#board.find_asset(asset_id);
			if (!asset || !(asset instanceof Asset)) {
				throw new Error(`Asset with ID '${asset_id}' not found`);
			}

			let notions = asset.to_object();
			delete notions.id; // It's not a notion

			const asset_data = {
				type: 'asset',
				id: asset.id,
				attributes: {
					name: asset.name,
					class_name: asset.constructor.name,
					notions: notions,
				},
			};
			
			res.set('Content-Type', 'application/vnd.api+json');
			res.json({
				jsonapi: { version: '1.0' },
				data: asset_data,
				links: {
					self: `${this.#base_url}/board/asset/${asset_id}`,
				},
			});
		} catch (err) {
			next(new Error(`Failed to retrieve asset: ${err.message}`));
		}
	}

	/**
	* Handles GET /board/segment/:id request, returning the segment's information and elements in JSON:API format.
	* @private
	* @param {express.Request} req - The Express request object.
	* @param {express.Response} res - The Express response object.
	* @param {express.NextFunction} next - The Express next function.
	*/
	#get_segment(req, res, next) {
		try {
			const segment_index = parseInt(req.params.id, 10);
			if (isNaN(segment_index) || segment_index < 0 || segment_index >= this.#board.segments.length) {
				throw new Error(`Segment with ID '${req.params.id}' not found.`);
			}
			
			const segment = this.#board.segments[segment_index];
			const segment_data = {
				type: 'segment',
				id: `${segment_index}`,
				attributes: {
					name: segment.name,
					class_name: segment.constructor.name,
				},
				relationships: {
					elements: {
						data: segment.elements.map((element, index) => element ? { type: element.constructor.name, id: `${index}` } : null).filter(e => e),
					},
				},
				links: {
					self: `${this.#base_url}/board/segment/${segment_index}`,
				},
			};
			
			const included = segment.elements.map((element, index) => {
				if (!element) return null;
				return {
					type: element.constructor.name,
					id: `${index}`,
					attributes: {
						summary: element.summary,
						static: element.static,
						asset_class: element.asset ? element.asset.constructor.name : null,
					},
					links: {
						self: `${this.#base_url}/board/segment/${segment_index}/element/${index}`,
					},
				};
			}).filter(e => e);
			
			res.set('Content-Type', 'application/vnd.api+json');
			res.json({
				jsonapi: { version: '1.0' },
				data: segment_data,
				included,
				links: {
					self: `${this.#base_url}/board/segment/${segment_index}`,
				},
			});
		} catch (err) {
			next(new Error(`Failed to retrieve segment: ${err.message}`));
		}
	}
	
	/**
	* Handles GET /board/segment/:id/element/:element_id request, returning the element's render in the requested format.
	* @private
	* @param {express.Request} req - The Express request object.
	* @param {express.Response} res - The Express response object.
	* @param {express.NextFunction} next - The Express next function.
	*/
	#get_element(req, res, next) {
		try {
			const segment_index = parseInt(req.params.id, 10);
			const element_index = parseInt(req.params.element_id, 10);
			if (isNaN(segment_index) || segment_index < 0 || segment_index >= this.#board.segments.length) {
				throw new Error(`Segment with ID '${req.params.id}' not found.`);
			}
			const segment = this.#board.segments[segment_index];
			if (isNaN(element_index) || element_index < 0 || element_index >= segment.elements.length || !segment.elements[element_index]) {
				throw new Error(`Element with ID '${req.params.element_id}' not found in segment '${req.params.id}'.`);
			}
			
			const element = segment.elements[element_index];
			const accepts = (req.get('Accept') || 'application/json').split(',').map(type => type.trim().toLowerCase());
			let render_format;
			let content_type;
			//'application/json, text/plain, */*'
			if(accepts.length === 0) { throw new Error('No Accept header provided. Supported types: application/json, text/plain'); }

			if(
				accepts.includes('application/vnd.api+json') 
			 || accepts.includes('application/json') 
			 || accepts.includes('*/*')) {

				render_format = 'object';
				content_type = 'application/vnd.api+json';
			
			} else if(
				accepts.includes('text/plain')) {

				render_format = 'text';
				content_type = 'text/plain';
				
			} else {
				throw new Error(`Unsupported Accept header '${req.get('Accept')}'. Supported types: application/json, text/plain`);
			}
			
			const render_data = element.render(render_format);
			if (render_format === 'object') {
				const element_data = {
					type: 'element',
					id: `${element_index}`,
					attributes: render_data,
					links: {
						self: `${this.#base_url}/board/segment/${segment_index}/element/${element_index}`,
					},
				};
				
				res.set('Content-Type', content_type);
				res.json({
					jsonapi: { version: '1.0' },
					data: element_data,
					links: {
						self: `${this.#base_url}/board/segment/${segment_index}/element/${element_index}`,
					},
				});
			} else {
				res.set('Content-Type', content_type);
				res.send(render_data);
			}
		} catch (err) {
			next(new Error(`Failed to retrieve element: ${err.message}`));
		}
	}
	
	/**
	* Handles GET /board/ request, returning the board's name and segments in JSON:API format.
	* @private
	* @param {express.Request} req - The Express request object.
	* @param {express.Response} res - The Express response object.
	* @param {express.NextFunction} next - The Express next function.
	*/
	#get_board(req, res, next) {
		try {
			const board_data = {
				type: 'board',
				id: this.#board.name,
				attributes: {
					name: this.#board.name,
				},
				relationships: {
					segments: {
						data: this.#board.segments.map((segment, index) => ({
							type: 'segment',
							id: `${index}`,
						})),
					},
				},
				links: {
					self: `${this.#base_url}/board/`,
				},
			};
			
			const included = this.#board.segments.map((segment, index) => ({
				type: 'segment',
				id: `${index}`,
				attributes: {
					name: segment.name,
					class_name: segment.constructor.name,
				},
				links: {
					self: `${this.#base_url}/board/segment/${index}`,
				},
			}));
			
			res.set('Content-Type', 'application/vnd.api+json');
			res.json({
				jsonapi: { version: '1.0' },
				data: board_data,
				included,
				links: {
					self: `${this.#base_url}/board/`,
				},
			});
		} catch (err) {
			next(new Error(`Failed to retrieve board: ${err.message}`));
		}
	}
}

module.exports = BoardRouter;