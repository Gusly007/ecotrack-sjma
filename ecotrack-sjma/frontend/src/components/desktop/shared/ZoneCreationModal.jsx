import { useState, useEffect, useCallback } from 'react';
import { Modal, FormGroup, FormRow, Input, ColorPicker, Button } from '../../common';
import ZoneMap from './ZoneMap';
import { zoneService } from '../../../services/zoneService';
import './ZoneCreationModal.css';

const colors = [
  { value: '#4CAF50', label: 'Vert' },
  { value: '#2196F3', label: 'Bleu' },
  { value: '#FF9800', label: 'Orange' },
  { value: '#9c27b0', label: 'Violet' },
  { value: '#f44336', label: 'Rouge' },
  { value: '#00BCD4', label: 'Cyan' },
  { value: '#E91E63', label: 'Rose' },
  { value: '#673AB7', label: 'Indigo' }
];

export default function ZoneCreationModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  role = 'MANAGER',
  existingZones = []
}) {
  const [isDrawing, setIsDrawing] = useState(false);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [formData, setFormData] = useState({
    nom: '',
    code: '',
    population: '',
    superficie_km2: '',
    latitude: '',
    longitude: '',
    couleur: colors[0].value,
    geometry: null,
    layerType: null
  });

  const [drawnZone, setDrawnZone] = useState(null);

  // Réinitialiser et générer le code quand on ouvre
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setIsDrawing(false);
      setDrawnZone(null);
      setError(null);
      
      // Générer un code unique (max 10 caractères)
      const timestamp = Date.now().toString(36).toUpperCase().slice(-4);
      const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
      const generatedCode = `ZN${timestamp}${random}`;
      
      setFormData({
        nom: '',
        code: generatedCode,
        population: '',
        superficie_km2: '',
        latitude: '',
        longitude: '',
        couleur: colors[0].value,
        geometry: null,
        layerType: null
      });
    }
  }, [isOpen]);

  const estimateZoneData = useCallback((zoneData) => {
    const density = 2000;
    const estimatedPopulation = Math.round(zoneData.area * density);
    
    return {
      population: estimatedPopulation,
      superficie_km2: Math.round(zoneData.area * 100) / 100,
      latitude: zoneData.center.lat,
      longitude: zoneData.center.lng,
      geometry: zoneData.geometry,
      layerType: zoneData.layerType
    };
  }, []);

  const handleZoneCreated = (zoneData) => {
    setDrawnZone(zoneData);
    const estimates = estimateZoneData(zoneData);
    
    setFormData(prev => ({
      ...prev,
      ...estimates,
      couleur: prev.couleur // Garder la couleur sélectionnée
    }));
    
    setIsDrawing(false);
    setStep(2);
  };

  const validateForm = () => {
    if (!formData.nom.trim()) {
      setError('Le nom de la zone est requis');
      return false;
    }
    if (!formData.geometry) {
      setError('Veuillez dessiner une zone sur la carte');
      return false;
    }
    if (!formData.population || formData.population <= 0) {
      setError('La population doit être supérieure à 0');
      return false;
    }
    if (!formData.superficie_km2 || formData.superficie_km2 <= 0) {
      setError('La superficie doit être supérieure à 0');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setError(null);

    try {
      const zoneData = {
        nom: formData.nom,
        population: parseInt(formData.population),
        superficie_km2: parseFloat(formData.superficie_km2),
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        couleur: formData.couleur,
        geometry: formData.geometry
      };

      const result = await zoneService.create(zoneData);
      
      if (onSuccess) {
        onSuccess(result);
      }
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Erreur lors de la création de la zone');
    } finally {
      setLoading(false);
    }
  };

  // Rendu de l'étape 1 : Carte avec dessin
  const renderMapStep = () => (
    <div className="zone-creation-step">
      <div className="zone-creation-instructions">
        <h4>Étape 1 : Définir la zone sur la carte</h4>
        <p>Cliquez sur <strong>"Activer le dessin"</strong> puis dessinez la zone avec polygone ou cercle.</p>
      </div>

      <div className="zone-creation-actions">
        <Button 
          variant={isDrawing ? "secondary" : "primary"}
          onClick={() => setIsDrawing(!isDrawing)}
          icon={isDrawing ? "fa-lock" : "fa-draw-polygon"}
        >
          {isDrawing ? "Désactiver le dessin" : "Activer le dessin"}
        </Button>
        
        {drawnZone && (
          <Button variant="success" onClick={() => setStep(2)}>
            Continuer vers le formulaire
          </Button>
        )}
      </div>

      {/* Aperçu de la zone avec la couleur sélectionnée */}
      <div className="zone-creation-preview-map">
        <ZoneMap 
          zones={[
            ...existingZones,
            drawnZone ? {
              id: 'preview',
              nom: formData.nom || 'Nouvelle zone (preview)',
              code: formData.code,
              latitude: formData.latitude,
              longitude: formData.longitude,
              superficie_km2: formData.superficie_km2,
              population: formData.population,
              couleur: formData.couleur,
              geometry: drawnZone.geometry,
              conteneurs: 0
            } : null
          ].filter(Boolean)}
          isDrawing={isDrawing}
          onZoneCreated={handleZoneCreated}
          role={role}
          drawingColor={formData.couleur}
        />
      </div>

      {drawnZone && (
        <div className="zone-creation-preview">
          <h5>Zone dessinée</h5>
          <div className="preview-stats">
            <div className="preview-stat">
              <span className="preview-label">Forme :</span>
              <span className="preview-value" style={{ fontWeight: 600 }}>
                {drawnZone.layerType === 'polygon' ? 'Polygone' : 'Cercle'}
              </span>
            </div>
            <div className="preview-stat">
              <span className="preview-label">Superficie estimée :</span>
              <span className="preview-value">{drawnZone.area} km²</span>
            </div>
            <div className="preview-stat">
              <span className="preview-label">Population estimée :</span>
              <span className="preview-value">{Math.round(drawnZone.area * 2000).toLocaleString()} hab</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Rendu de l'étape 2 : Formulaire
  const renderFormStep = () => (
    <div className="zone-creation-step">
      <div className="zone-creation-instructions">
        <h4>Étape 2 : Compléter les informations</h4>
        <p>Vérifiez et modifiez les informations de la zone.</p>
      </div>

      <FormRow>
        <FormGroup label="Nom de la zone" required>
          <Input 
            value={formData.nom}
            onChange={(val) => setFormData({...formData, nom: val})}
            placeholder="Ex: Zone Nord-Est"
          />
        </FormGroup>
        <FormGroup label="Code (auto-généré)" required>
          <Input 
            value={formData.code}
            disabled
            placeholder="ZN-XXXXXX"
          />
        </FormGroup>
      </FormRow>

      <FormRow>
        <FormGroup label="Population estimée" required>
          <Input 
            type="number"
            value={formData.population}
            onChange={(val) => setFormData({...formData, population: parseInt(val) || 0})}
          />
          <span className="field-hint">Estimation basée sur une densité de 2000 hab/km²</span>
        </FormGroup>
        <FormGroup label="Superficie (km²)" required>
          <Input 
            type="number"
            step="0.01"
            value={formData.superficie_km2}
            onChange={(val) => setFormData({...formData, superficie_km2: parseFloat(val) || 0})}
          />
        </FormGroup>
      </FormRow>

      <FormRow>
        <FormGroup label="Latitude">
          <Input 
            type="number"
            step="0.000001"
            value={formData.latitude}
            disabled
          />
        </FormGroup>
        <FormGroup label="Longitude">
          <Input 
            type="number"
            step="0.000001"
            value={formData.longitude}
            disabled
          />
        </FormGroup>
      </FormRow>

      <FormGroup label="Couleur de la zone">
        <ColorPicker 
          value={formData.couleur}
          onChange={(color) => setFormData({...formData, couleur: color})}
          colors={colors.map(c => c.value)}
        />
      </FormGroup>

      {/* Aperçu avec la couleur */}
      <div className="zone-creation-preview-map">
        <h5>Aperçu de la zone ({drawnZone?.layerType === 'polygon' ? 'Polygone' : 'Cercle'})</h5>
        <ZoneMap 
          zones={drawnZone ? [{
            id: 'preview',
            nom: formData.nom || 'Nouvelle zone',
            code: formData.code,
            latitude: formData.latitude,
            longitude: formData.longitude,
            superficie_km2: formData.superficie_km2,
            population: formData.population,
            couleur: formData.couleur,
            geometry: drawnZone.geometry,
            conteneurs: 0
          }] : []}
          isDrawing={false}
          readOnly={true}
        />
      </div>

      <div className="zone-creation-navigation">
        <Button variant="secondary" onClick={() => setStep(1)}>
          <i className="fas fa-arrow-left"></i> Retour au dessin
        </Button>
        <div className="zone-creation-actions-right">
          <Button 
            variant="primary" 
            onClick={handleSubmit}
            loading={loading}
            icon="fa-save"
          >
            Créer la zone
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={step === 1 ? "Nouvelle zone - Dessin" : "Nouvelle zone - Informations"}
      headerIcon="fa-draw-polygon"
      headerColor="#4CAF50"
      size="xl"
      showCloseButton={false}
    >
      <div className="zone-creation-modal">
        <div className="zone-creation-steps">
          <div className={`step ${step === 1 ? 'active' : step > 1 ? 'completed' : ''}`}>
            <span className="step-number">1</span>
            <span className="step-label">Dessin</span>
          </div>
          <div className="step-divider"></div>
          <div className={`step ${step === 2 ? 'active' : ''}`}>
            <span className="step-number">2</span>
            <span className="step-label">Informations</span>
          </div>
        </div>

        {error && (
          <div className="zone-creation-error">
            <i className="fas fa-exclamation-circle"></i> {error}
          </div>
        )}

        {step === 1 ? renderMapStep() : renderFormStep()}
      </div>
    </Modal>
  );
}
