const crudcontainer = require('./crud');
const db = {}; // Mock database object for testing

describe('crudcontainer model', () => {
  let model;
    beforeAll(() => {
    model = new crudcontainer(db);
  });

  describe('createcontainer', () => {
    it('should throw an error if capacity or location is missing', async () => {
      await expect(model.createcontainer(null, 'Location A')).rejects.toThrow('Missing required fields: capacity and location');
      await expect(model.createcontainer(100, null)).rejects.toThrow('Missing required fields: capacity and location');
    }); 
    it('should insert a new container and return it', async () => {
      db.query = jest.fn().mockResolvedValue({ rows: [{ id: 1, capacity: 100, location: 'Location A' }] });
      const result = await model.createcontainer(100, 'Location A');  
        expect(db.query).toHaveBeenCalledWith(
        'INSERT INTO conteneur (capacity, location, created_at, updated_at) VALUES ($1, $2, $3, $4) RETURNING *',
        [100, 'Location A', expect.any(String), expect.any(String)]
      );
      expect(result).toEqual({ id: 1, capacity: 100, location: 'Location A' });
    });
  });
describe('updatecontainer', () => {    
    it('should throw an error if id is missing', async () => {
      await expect(model.updatecontainer(null, 'New Location')).rejects.toThrow('missing required field :id');
    });
    it('should update the container and return it', async () => {
      db.query = jest.fn().mockResolvedValue({ rows: [{ id: 1, capacity: 100, location: 'New Location' }] });
      const result = await model.updatecontainer(1, 'New Location');
        expect(db.query).toHaveBeenCalledWith(
            'UPDATE conteneur SET location=$1, updated_at=$2 WHERE id=$3 RETURNING *',
            ['New Location', expect.any(String), 1]
        );
        expect(result).toEqual({ id: 1, capacity: 100, location: 'New Location' });
    });
    });

    describe('getcontainerById', () => {    
    it('should return the container with the given id', async () => {
        db.query = jest.fn().mockResolvedValue({ rows: [{ id: 1, capacity: 100, location: 'Location A' }] });
        const result = await model.getcontainerById(1);
        expect(db.query).toHaveBeenCalledWith(
            'SELECT * FROM conteneur WHERE id = $1', [1]
        );
        expect(result).toEqual({ id: 1, capacity: 100, location: 'Location A' });
    });
    });
});  