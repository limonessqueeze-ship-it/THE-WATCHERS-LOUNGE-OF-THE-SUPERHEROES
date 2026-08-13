import React, { useState, useRef } from 'react';
import { 
  Upload, 
  Image as ImageIcon, 
  X, 
  Check, 
  Sparkles, 
  Shield, 
  PlusCircle, 
  Link as LinkIcon, 
  FileText,
  CheckCircle2
} from 'lucide-react';
import { Theory, MCUPhase, TheoryCategory } from '../types';
import { useAuth } from '../context/AuthContext';
import { checkExplicitName } from '../utils/profanityFilter';

interface TheoryAnalyzerProps {
  onPublishTheory: (theory: Theory) => void;
}

export const TheoryAnalyzer: React.FC<TheoryAnalyzerProps> = ({ onPublishTheory }) => {
  const { user, updateNexusPoints } = useAuth();
  
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<TheoryCategory>('Películas');
  const [phase, setPhase] = useState<MCUPhase>('Fase 6');
  const [premise, setPremise] = useState('');
  const [fullContent, setFullContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [showUrlField, setShowUrlField] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [published, setPublished] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      setErrorMessage('La imagen sobrepasa los 8MB. Elige otra foto de tu biblioteca.');
      return;
    }

    setErrorMessage(null);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setImageUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleAddUrlImage = () => {
    if (!urlInput.trim()) return;
    setImageUrl(urlInput.trim());
    setUrlInput('');
    setShowUrlField(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!title.trim()) {
      setErrorMessage('Escribe un título para tu teoría.');
      return;
    }

    if (!premise.trim()) {
      setErrorMessage('Escribe una premisa o resumen para tu teoría.');
      return;
    }

    // Profanity filter check
    const filterCheck = checkExplicitName(`${title} ${premise} ${fullContent}`);
    if (filterCheck.isExplicit) {
      setErrorMessage('⚠️ Tu teoría contiene vocabulario explícito o restringido.');
      return;
    }

    const newTheory: Theory = {
      id: 'theory-user-' + Date.now(),
      title: title.trim(),
      premise: premise.trim(),
      fullContent: fullContent.trim() || premise.trim(),
      authorName: user?.username || 'Agente de la TVA',
      authorHandle: user?.agentHandle || '@agente_tva',
      authorAvatar: user?.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop',
      phase: phase,
      category: category,
      tags: [category, phase, 'Comunidad'],
      nexusProbability: Math.floor(Math.random() * 30) + 65,
      nexusRisk: 'Moderado',
      nexusPoints: 1,
      commentsCount: 0,
      createdAt: new Date().toISOString(),
      imageUrl: imageUrl || undefined,
      isAiGenerated: false,
      isNexusEvent: false
    };

    onPublishTheory(newTheory);
    updateNexusPoints(25);
    setPublished(true);

    setTimeout(() => {
      setPublished(false);
    }, 3000);
  };

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-6">
      
      {/* Title Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-950/80 border border-red-500/40 text-amber-300 text-xs font-mono font-bold uppercase tracking-wider">
          <PlusCircle className="w-3.5 h-3.5 text-amber-400" /> PUBLICAR EN LA ARENA DE TEORÍAS
        </div>
        <h1 className="font-cinzel text-2xl sm:text-3xl font-bold text-white">
          CREA Y COMPARTE TU TEORÍA
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto">
          Escribe tu hipótesis del MCU y adjunta imágenes directo desde la galería de tu dispositivo o un enlace.
        </p>
      </div>

      {errorMessage && (
        <div className="p-3 rounded-xl bg-red-950/80 border border-red-600 text-red-200 text-xs font-mono">
          {errorMessage}
        </div>
      )}

      {/* Main Form Card */}
      <form onSubmit={handleSubmit} className="tva-card rounded-2xl p-6 space-y-5 shadow-2xl">
        
        {/* Title input */}
        <div>
          <label className="block text-xs font-mono uppercase tracking-wider text-amber-400 font-bold mb-1.5">
            1. Título de la Teoría *
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Ej. Doctor Strange creó el Telar del Tiempo en el Vacío"
            className="w-full px-4 py-2.5 rounded-xl bg-[#090304] border border-[#2d0a0a] text-sm text-white focus:outline-none focus:border-[#DC2626] transition-colors"
          />
        </div>

        {/* Category & Phase select row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 font-bold mb-1.5">
              Categoría
            </label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value as TheoryCategory)}
              className="w-full px-4 py-2.5 rounded-xl bg-[#090304] border border-[#2d0a0a] text-sm text-white focus:outline-none focus:border-[#DC2626] transition-colors"
            >
              <option value="Películas">Películas</option>
              <option value="Series Disney+">Series Disney+</option>
              <option value="Cómics">Cómics</option>
              <option value="Especulación Salvaje">Especulación Salvaje</option>
              <option value="Canon Confirmado">Canon Confirmado</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 font-bold mb-1.5">
              Fase del MCU Target
            </label>
            <select
              value={phase}
              onChange={e => setPhase(e.target.value as MCUPhase)}
              className="w-full px-4 py-2.5 rounded-xl bg-[#090304] border border-[#2d0a0a] text-sm text-white focus:outline-none focus:border-[#DC2626] transition-colors"
            >
              <option value="Fase 4">Fase 4</option>
              <option value="Fase 5">Fase 5</option>
              <option value="Fase 6">Fase 6</option>
              <option value="Multiverse Saga">Multiverse Saga</option>
            </select>
          </div>
        </div>

        {/* Premise / Short description */}
        <div>
          <label className="block text-xs font-mono uppercase tracking-wider text-amber-400 font-bold mb-1.5">
            2. Resumen / Premisa Principal *
          </label>
          <input
            type="text"
            required
            value={premise}
            onChange={e => setPremise(e.target.value)}
            placeholder="Resumen rápido de 1 o 2 oraciones..."
            className="w-full px-4 py-2.5 rounded-xl bg-[#090304] border border-[#2d0a0a] text-sm text-white focus:outline-none focus:border-[#DC2626] transition-colors"
          />
        </div>

        {/* Full content / Evidences */}
        <div>
          <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 font-bold mb-1.5">
            3. Desarrollo Completo y Evidencias (Opcional)
          </label>
          <textarea
            rows={4}
            value={fullContent}
            onChange={e => setFullContent(e.target.value)}
            placeholder="Explica los detalles, escenas de las películas, cómics o pistas que apoyan tu teoría..."
            className="w-full px-4 py-2.5 rounded-xl bg-[#090304] border border-[#2d0a0a] text-sm text-white focus:outline-none focus:border-[#DC2626] transition-colors resize-none"
          />
        </div>

        {/* IMAGE ATTACHMENT SECTION FROM GALLERY / FILES */}
        <div className="pt-3 border-t border-[#2d0a0a] space-y-3">
          <label className="block text-xs font-mono uppercase tracking-wider text-amber-400 font-bold">
            🖼️ Adjuntar Imagen o Evidencia Visual (De tu Biblioteca)
          </label>

          {/* Hidden File Input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageFileChange}
            accept="image/*"
            className="hidden"
          />

          {/* If Image is attached, show preview */}
          {imageUrl ? (
            <div className="relative rounded-2xl overflow-hidden border border-amber-500/50 bg-[#060203] p-2 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 overflow-hidden">
                <img
                  src={imageUrl}
                  alt="Previsualización"
                  className="w-20 h-20 rounded-xl object-cover border border-amber-500/30 flex-shrink-0"
                />
                <div className="text-xs space-y-1">
                  <span className="text-emerald-400 font-bold flex items-center gap-1 font-mono">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Imagen Adjuntada
                  </span>
                  <p className="text-slate-400 text-[11px] font-mono">Lista para incluirse en tu teoría.</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setImageUrl('')}
                className="p-2 rounded-xl bg-red-950 text-red-400 hover:bg-red-900 border border-red-700 transition-colors flex-shrink-0"
                title="Eliminar imagen"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                
                {/* File picker button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="py-3 px-4 rounded-xl bg-[#18090b] border-2 border-dashed border-[#DC2626]/60 hover:border-[#DC2626] hover:bg-[#200b0e] text-amber-200 font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg"
                >
                  <Upload className="w-4 h-4 text-[#DC2626]" />
                  <span>Subir Foto de tu Galería</span>
                </button>

                {/* URL button */}
                <button
                  type="button"
                  onClick={() => setShowUrlField(!showUrlField)}
                  className="py-3 px-4 rounded-xl bg-[#120708] border border-[#2d0a0a] hover:border-slate-700 text-slate-300 font-bold text-xs flex items-center justify-center gap-2 transition-all"
                >
                  <LinkIcon className="w-4 h-4 text-amber-400" />
                  <span>Pegar Enlace URL</span>
                </button>

              </div>

              {showUrlField && (
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={urlInput}
                    onChange={e => setUrlInput(e.target.value)}
                    placeholder="https://ejemplo.com/imagen.jpg"
                    className="flex-1 px-3 py-2 rounded-xl bg-[#090304] border border-[#2d0a0a] text-xs text-white focus:outline-none focus:border-[#DC2626]"
                  />
                  <button
                    type="button"
                    onClick={handleAddUrlImage}
                    className="px-4 py-2 bg-[#DC2626] text-white rounded-xl text-xs font-bold hover:bg-red-700"
                  >
                    Cargar
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="pt-4 border-t border-[#2d0a0a]">
          <button
            type="submit"
            className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#DC2626] via-red-600 to-amber-600 hover:from-red-600 hover:to-amber-500 text-white font-bold text-sm shadow-xl shadow-red-950/60 active:scale-98 transition-all flex items-center justify-center gap-2 uppercase tracking-wider"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Publicar Teoría en la Arena (+25 Pts)</span>
          </button>
        </div>

      </form>

    </div>
  );
};
