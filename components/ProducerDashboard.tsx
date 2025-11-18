import React, { useState, useRef, useEffect, lazy, Suspense } from 'react';
import type { Producer, Artist, Stoodio, Engineer, LinkAttachment, Post, Conversation } from '../types';
import { UserRole, AppView, SubscriptionPlan } from '../types';
import { DollarSignIcon, CalendarIcon, UsersIcon, StarIcon, MusicNoteIcon, MagicWandIcon, EditIcon, PhotoIcon } from './icons';
import CreatePost from './CreatePost.tsx';