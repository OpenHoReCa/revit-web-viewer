import { ObjectLoader, Object3D, Geometry, BufferGeometry, Box3, Sphere, Mesh } from 'three';

/**
 * Wraps all model-related functionality
 * @class RevitModel
 */
export class Model {
    static readonly loader  = new ObjectLoader();   // a loader for loading a JSON resource

    readonly object             : Object3D;             // Revit 3D model, provides a set of properties and methods for manipulating objects in 3D space
    readonly pivot              : Object3D;             // needed for rotation and other stuff
    protected geometry          : Geometry;             // the geometry of currently loaded object
    private _boundingSphere     : Sphere;               // bounding sphere that encompasses everything in the scene
    private _boundingBox        : Box3;                 // bounding box for the Geometry, which can be calculated with

    /**
     * Creates an instance of RevitModel.
     * @memberof RevitModel
     */
    constructor( object3D : Object3D ) {
        this.object = object3D;
        this.pivot = new Object3D();
        this.pivot.add( this.object );

        // Compute bounding box for geometry-related operations
        // and bounding sphere for lights
        this.getBoundingFigures();
    }

    /**
     * Gets _boundingSphere value
     */
    get boundingSphere(): Sphere {
        return this._boundingSphere;
    }
    /**
     * Sets _boundingSphere value
     */
    set boundingSphere(boundingSphere: Sphere) {
        this._boundingSphere = boundingSphere;
    }

    /**
     * Gets _boundingBox value
     */
    get boundingBox(): Box3 {
        return this._boundingBox;
    }

    /**
     * Sets _boundingBox value
     */
    set boundingBox(boundingBox: Box3) {
        this._boundingBox = boundingBox;
    }

    /**
     * Loads model object from URL
     * @param {string} url
     * @returns {Promise<Object3D>}
     * @memberof RevitModel
     */
    static async loadFromURL(url : string) : Promise<Object3D> {
        let modelJson = {};
        try{
            let modelText = await Model.getFromURL(url);
            modelJson = JSON.parse(modelText);
        } catch(e) {
            console.error(e);
        }
        return Model.loadFromJSON( modelJson );
    }

    /**
     * Loads model object from a JSON object
     * @param {Object} modelJson
     * @returns {Object3D}
     * @memberof RevitModel
     */
    static loadFromJSON( modelJson : Object) : Object3D {
        try {
            let object = Model.loader.parse( modelJson );
            return object;
        } catch(e) {
            console.error(e);
            return null;
        }
    }

    /**
     * Get model's JSON text content from URL
     * @param url
     */
    static getFromURL(url) : Promise<string>{
        return new Promise<string>(
            (resolve, reject) => {
                const request = new XMLHttpRequest();
                request.onload = () => {
                    if(4 === request.readyState) {
                        if (200 === request.status || 0 === request.status) {
                            resolve(request.response);
                        } else {
                            reject(new Error(request.statusText));
                        }
                    }
                };
                request.onerror = () => {
                    reject(new Error('XMLHttpRequest Error: '+ request.statusText));
                };
                request.open('GET', url);
                request.send();
            }
        );
    };

    /**
     * Loops over the children of the THREE scene, merge them into a mesh,
     * and compute a bounding sphere for the scene
     * @memberof RevitModel
     */
    getBoundingFigures() : void {
        let geometry = new Geometry();
        this.object.traverse( (child) => {
            if(child instanceof Mesh ) {
                if (child.geometry instanceof Geometry) {
                    geometry.merge( child.geometry );
                } else if (child.geometry instanceof BufferGeometry) {
                    let convertedGeometry = new Geometry();
                    convertedGeometry.fromBufferGeometry(child.geometry);
                    geometry.merge( convertedGeometry );
                }
            }
        });

        geometry.computeBoundingSphere();
        this.boundingSphere = geometry.boundingSphere;

        geometry.computeBoundingBox();
        this.boundingBox = geometry.boundingBox;

        this.geometry = geometry;
    };
}
