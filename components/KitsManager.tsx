import React, { useState, useEffect, useRef, useMemo } from 'react';
import type { Producer, ProducerProduct, ProducerProductType } from '../types';
import { MusicNoteIcon, PlusCircleIcon, EditIcon, TrashIcon, CloseIcon, SearchIcon } from './icons';
import * as apiService from '../services/apiService';

interface KitsManagerProps {
    producer: Producer;
    onRefresh: () => void;
}

const TYPES: { value: ProducerProductType; label: string }[] = [
    { value: 'drum_kit', label: 'Drum Kit' },
    { value: 'vst_preset', label: 'VST Preset' },
    { value: 'sample_pack', label: 'Sample Pack' },
    { value: 'other', label: 'Other' },
];

const ProductFormModal: React.FC<{
    product: Partial<ProducerProduct> | null;
    onSave: (p: Record<string, any>, deliveryFile?: File | null, coverFile?: File | null) => void;
    onClose: () => void;
    isSaving: boolean;
}> = ({ product, onSave, onClose, isSaving }) => {
    const [type, setType] = useState<ProducerProductType>(product?.type || 'drum_kit');
    const [title, setTitle] = useState(product?.title || '');
    const [description, setDescription] = useState(product?.description || '');
    const [price, setPrice] = useState(product?.price ?? 0);
    const [deliveryType, setDeliveryType] = useState<'link' | 'file'>(product?.delivery_type === 'file' ? 'file' : 'link');
    const [deliveryValue, setDeliveryValue] = useState(product?.delivery_type === 'link' ? product?.delivery_value || '' : '');
    const [deliveryFile, setDeliveryFile] = useState<File | null>(null);
    const [coverFile, setCoverFile] = useState<File | null>(null);
    const deliveryFileRef = useRef<HTMLInputElement>(null);
    const coverFileRef = useRef<HTMLInputElement>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) {
            alert('Title is required.');
            return;
        }
        if (price < 0) {
            alert('Price must be 0 or more.');
            return;
        }
        if (deliveryType === 'link') {
            if (!deliveryValue.trim()) {
                alert('Please enter the delivery URL.');
                return;
            }
            onSave({ type, title, description: description || undefined, price, delivery_type: 'link', delivery_value: deliveryValue.trim(), cover_url: product?.cover_url }, null, coverFile || null);
            return;
        }
        // file
        if (!product?.id && !deliveryFile) {
            alert('Please select a file for new products.');
            return;
        }
        if (product?.id && !deliveryFile && !product?.delivery_value) {
            alert('Existing product has no file. Please select a file.');
            return;
        }
        onSave(
            {
                ...product,
                type,
                title,
                description: description || undefined,
                price,
                delivery_type: 'file',
                delivery_value: product?.delivery_type === 'file' ? product.delivery_value : '',
                cover_url: product?.cover_url,
            },
            deliveryFile,
            coverFile
        );
    };

    const inputCls = 'w-full p-2 bg-zinc-800/70 border border-zinc-700 text-zinc-200 rounded-md focus:ring-2 focus:ring-orange-500';

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="w-full max-w-lg cardSurface">
                <div className="p-6 border-b border-zinc-700/50 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-zinc-100">{product?.id ? 'Edit Product' : 'Add Kit or Preset'}</h2>
                    <button onClick={onClose} disabled={isSaving} className="text-zinc-400 hover:text-zinc-200">
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                        <div>
                            <label className="block text-sm font-medium text-zinc-300 mb-1">Type</label>
                            <select value={type} onChange={(e) => setType(e.target.value as ProducerProductType)} className={inputCls} required>
                                {TYPES.map((t) => (
                                    <option key={t.value} value={t.value}>{t.label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-zinc-300 mb-1">Title</label>
                            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-zinc-300 mb-1">Description (optional)</label>
                            <textarea value={description} onChange={(e) => setDescription(e.target.value)} className={inputCls} rows={2} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-zinc-300 mb-1">Price ($)</label>
                            <input type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))} step="0.01" min="0" className={inputCls} required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-zinc-300 mb-1">Delivery</label>
                            <div className="flex gap-4 mb-2">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="radio" name="del" checked={deliveryType === 'link'} onChange={() => { setDeliveryType('link'); setDeliveryFile(null); }} />
                                    <span className="text-zinc-300">Link (URL)</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="radio" name="del" checked={deliveryType === 'file'} onChange={() => { setDeliveryType('file'); setDeliveryValue(''); }} />
                                    <span className="text-zinc-300">File (upload)</span>
                                </label>
                            </div>
                            {deliveryType === 'link' ? (
                                <input type="url" value={deliveryValue} onChange={(e) => setDeliveryValue(e.target.value)} placeholder="https://..." className={inputCls} />
                            ) : (
                                <div
                                    onClick={() => !isSaving && deliveryFileRef.current?.click()}
                                    className="p-4 border-2 border-dashed border-zinc-600 rounded-md cursor-pointer hover:border-orange-500 text-center text-sm text-zinc-400"
                                >
                                    {deliveryFile ? deliveryFile.name : product?.delivery_type === 'file' && product?.delivery_value ? 'Click to replace file' : 'Click to select file'}
                                </div>
                            )}
                            <input type="file" ref={deliveryFileRef} onChange={(e) => setDeliveryFile(e.target.files?.[0] || null)} className="hidden" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-zinc-300 mb-1">Cover image (optional)</label>
                            <div
                                onClick={() => !isSaving && coverFileRef.current?.click()}
                                className="p-4 border-2 border-dashed border-zinc-600 rounded-md cursor-pointer hover:border-orange-500 text-center text-sm text-zinc-400"
                            >
                                {coverFile ? coverFile.name : product?.cover_url ? 'Click to replace cover' : 'Click to select image'}
                            </div>
                            <input type="file" ref={coverFileRef} onChange={(e) => setCoverFile(e.target.files?.[0] || null)} accept="image/*" className="hidden" />
                        </div>
                    </div>
                    <div className="p-4 bg-zinc-900/50 border-t border-zinc-700/50 flex justify-end gap-2">
                        <button type="button" onClick={onClose} disabled={isSaving} className="px-4 py-2 rounded bg-zinc-700 text-zinc-200 hover:bg-zinc-600">
                            Cancel
                        </button>
                        <button type="submit" disabled={isSaving} className="px-4 py-2 rounded bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50">
                            {isSaving ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const KitsManager: React.FC<KitsManagerProps> = ({ producer, onRefresh }) => {
    const [products, setProducts] = useState<ProducerProduct[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editing, setEditing] = useState<Partial<ProducerProduct> | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState<ProducerProductType | 'All'>('All');
    const [sortBy, setSortBy] = useState<'newest' | 'title' | 'price'>('newest');

    const load = async () => {
        const list = await apiService.fetchProducerProducts(producer.id);
        setProducts(Array.isArray(list) ? list : []);
    };

    useEffect(() => {
        load();
    }, [producer.id]);

    const openAdd = () => {
        setEditing(null);
        setIsModalOpen(true);
    };

    const openEdit = (p: ProducerProduct) => {
        setEditing(p);
        setIsModalOpen(true);
    };

    const handleSave = async (
        payload: Record<string, any>,
        deliveryFile?: File | null,
        coverFile?: File | null
    ) => {
        setIsSaving(true);
        try {
            let delivery_value = payload.delivery_value;
            let cover_url = payload.cover_url;

            if (deliveryFile) {
                const res = await apiService.uploadAsset(producer.id, deliveryFile, { type: 'product' });
                delivery_value = (res as any)?.url || '';
            }
            if (coverFile) {
                const res = await apiService.uploadAsset(producer.id, coverFile, { type: 'product_cover' });
                cover_url = (res as any)?.url || '';
            }

            await apiService.upsertProducerProduct({
                ...payload,
                id: payload.id,
                producer_id: producer.id,
                delivery_value,
                cover_url: cover_url || payload.cover_url,
            });
            await load();
            onRefresh();
            setIsModalOpen(false);
            setEditing(null);
        } catch (e) {
            console.error('Save product failed', e);
            alert('Failed to save. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Delete this product? This cannot be undone.')) return;
        try {
            await apiService.deleteProducerProduct(id);
            await load();
            onRefresh();
        } catch (e) {
            console.error('Delete product failed', e);
            alert('Failed to delete.');
        }
    };

    // Filter and sort products
    const filteredAndSorted = useMemo(() => {
        let filtered = products.filter(p => {
            const matchesSearch = !searchTerm || 
                p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (p.description || '').toLowerCase().includes(searchTerm.toLowerCase());
            const matchesType = typeFilter === 'All' || p.type === typeFilter;
            return matchesSearch && matchesType;
        });

        filtered.sort((a, b) => {
            switch (sortBy) {
                case 'title':
                    return a.title.localeCompare(b.title);
                case 'price':
                    return (b.price || 0) - (a.price || 0);
                case 'newest':
                default:
                    return 0; // Keep original order
            }
        });

        return filtered;
    }, [products, searchTerm, typeFilter, sortBy]);

    return (
        <div className="p-6 aria-glass rounded-[40px] aria-metal-stroke shadow-2xl relative overflow-hidden group">
            {/* Decorative background icon */}
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-all duration-500">
                <MusicNoteIcon className="w-32 h-32 text-orange-400" />
            </div>

            <div className="relative z-10">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse"></div>
                            <h1 className="text-3xl font-black text-zinc-100 tracking-tight">Kits & Presets</h1>
                        </div>
                        <p className="text-sm text-zinc-400">Sell drum kits, VST presets, and sample packs</p>
                    </div>
                    <button 
                        onClick={openAdd} 
                        className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-pink-600 text-white font-black py-3 px-6 rounded-xl hover:from-orange-600 hover:to-pink-700 transition-all shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40 text-sm"
                    >
                        <PlusCircleIcon className="w-5 h-5" /> Add Product
                    </button>
                </div>

                {/* Search and Filters */}
                <div className="mb-6 space-y-4">
                    {/* Search Bar */}
                    <div className="relative">
                        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                        <input
                            type="text"
                            placeholder="Search products by title or description..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-zinc-900/50 border border-white/10 rounded-xl text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all"
                        />
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2 text-xs text-zinc-500 uppercase tracking-[0.2em] font-black">
                            Type:
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {['All', ...TYPES.map(t => t.value)].map(type => (
                                <button
                                    key={type}
                                    onClick={() => setTypeFilter(type as any)}
                                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                                        typeFilter === type
                                            ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                                            : 'bg-zinc-800/50 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-300 border border-white/5'
                                    }`}
                                >
                                    {type === 'All' ? 'All' : TYPES.find(t => t.value === type)?.label || type}
                                </button>
                            ))}
                        </div>
                        <div className="ml-auto flex items-center gap-2">
                            <span className="text-xs text-zinc-500 uppercase tracking-[0.2em] font-black">Sort:</span>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as any)}
                                className="px-4 py-2 bg-zinc-800/50 border border-white/10 rounded-lg text-sm text-zinc-300 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                            >
                                <option value="newest">Newest First</option>
                                <option value="title">Title A-Z</option>
                                <option value="price">Price: High to Low</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Products Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredAndSorted.length > 0 ? (
                        filteredAndSorted.map((p) => (
                            <div key={p.id} className="aria-glass rounded-2xl p-6 border border-white/10 hover:border-orange-500/30 transition-all duration-300 group relative overflow-hidden">
                                {/* Hover gradient effect */}
                                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/0 to-pink-600/0 group-hover:from-orange-500/5 group-hover:to-pink-600/5 transition-all duration-300"></div>
                                
                                <div className="relative z-10">
                                    {/* Cover Art */}
                                    <div className="relative mb-4 aspect-square rounded-xl overflow-hidden bg-zinc-800 border border-white/5 group-hover:scale-[1.02] transition-transform duration-300">
                                        {p.cover_url ? (
                                            <img src={p.cover_url} alt={p.title} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <MusicNoteIcon className="w-16 h-16 text-zinc-600" />
                                            </div>
                                        )}
                                        {/* Type Badge */}
                                        <div className="absolute top-2 left-2 px-3 py-1 bg-black/60 backdrop-blur-sm rounded-full border border-white/20">
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-400">
                                                {TYPES.find(t => t.value === p.type)?.label || p.type.replace(/_/g, ' ')}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Title */}
                                    <h3 className="font-black text-xl text-zinc-100 mb-2 tracking-tight line-clamp-1">{p.title}</h3>

                                    {/* Description */}
                                    {p.description && (
                                        <p className="text-sm text-zinc-400 mb-4 line-clamp-2">{p.description}</p>
                                    )}

                                    {/* Price */}
                                    <div className="mb-4 pb-4 border-b border-white/5">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-zinc-500 uppercase tracking-[0.1em]">Price</span>
                                            <span className="font-black text-green-400 text-xl">${Number(p.price || 0).toFixed(2)}</span>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2">
                                        <button 
                                            onClick={() => openEdit(p)} 
                                            className="flex-1 px-4 py-2 bg-zinc-800/50 hover:bg-orange-500/20 text-zinc-300 hover:text-orange-400 rounded-lg border border-white/5 hover:border-orange-500/30 transition-all font-bold text-sm flex items-center justify-center gap-2"
                                        >
                                            <EditIcon className="w-4 h-4"/>
                                            Edit
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(p.id)} 
                                            className="px-4 py-2 bg-zinc-800/50 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 rounded-lg border border-white/5 hover:border-red-500/30 transition-all"
                                        >
                                            <TrashIcon className="w-4 h-4"/>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full text-center py-16 aria-glass rounded-2xl border border-white/10">
                            <div className="relative inline-block mb-4">
                                <div className="absolute inset-0 bg-orange-500/20 blur-3xl rounded-full"></div>
                                <MusicNoteIcon className="relative w-16 h-16 mx-auto text-zinc-600" />
                            </div>
                            <p className="text-zinc-400 font-semibold mb-2">No products found</p>
                            {searchTerm || typeFilter !== 'All' ? (
                                <p className="text-sm text-zinc-500">Try adjusting your filters</p>
                            ) : (
                                <>
                                    <p className="text-sm text-zinc-500 mb-4">Sell drum kits, VST presets, and sample packs</p>
                                    <button 
                                        onClick={openAdd} 
                                        className="px-6 py-2 bg-gradient-to-r from-orange-500 to-pink-600 text-white font-black rounded-lg hover:from-orange-600 hover:to-pink-700 transition-all"
                                    >
                                        Add Product
                                    </button>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
            {isModalOpen && (
                <ProductFormModal
                    product={editing}
                    onSave={handleSave}
                    onClose={() => { setIsModalOpen(false); setEditing(null); }}
                    isSaving={isSaving}
                />
            )}
        </div>
    );
};

export default KitsManager;
