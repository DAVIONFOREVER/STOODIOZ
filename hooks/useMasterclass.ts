import { useCallback, useMemo } from 'react';
import { useAppState, useAppDispatch, ActionTypes } from '../contexts/AppContext';
import type { Masterclass, Engineer, Producer, Review, Transaction } from '../types';
import { TransactionCategory, TransactionStatus } from '../types';

export const useMasterclass = () => {
    const dispatch = useAppDispatch();
    const { currentUser, reviews, artists, engineers, producers, stoodioz, masterclassToPurchase, masterclassToReview } = useAppState();

    const openPurchaseMasterclassModal = useCallback((masterclass: Masterclass, owner: Engineer | Producer) => {
        dispatch({ type: ActionTypes.OPEN_PURCHASE_MASTERCLASS_MODAL, payload: { masterclass, owner } });
    }, [dispatch]);

    const openWatchMasterclassModal = useCallback((masterclass: Masterclass, owner: Engineer | Producer) => {
        dispatch({ type: ActionTypes.OPEN_WATCH_MASTERCLASS_MODAL, payload: { masterclass, owner } });
    }, [dispatch]);

    const confirmMasterclassPurchase = useCallback(() => {
        if (!currentUser || !masterclassToPurchase) return;

        const { masterclass, owner } = masterclassToPurchase;
        
        // 1. Create transactions
        const purchaseTransaction: Transaction = {
            id: `txn-${Date.now()}`,
            date: new Date().toISOString(),
            description: `Masterclass Purchase: "${masterclass.title}"`,
            amount: -masterclass.price,
            category: TransactionCategory.MASTERCLASS_PURCHASE,
            status: TransactionStatus.COMPLETED,
            relatedUserName: owner.name,
        };
        const payoutTransaction: Transaction = {
            id: `txn-${Date.now() + 1}`,
            date: new Date().toISOString(),
            description: `Masterclass Sale: "${masterclass.title}"`,
            amount: masterclass.price * 0.9, // Assuming a 10% platform fee
            category: TransactionCategory.MASTERCLASS_PAYOUT,
            status: TransactionStatus.COMPLETED,
            relatedUserName: currentUser.name,
        };

        // 2. Update users
        const updatedCurrentUser = {
            ...currentUser,
            wallet_balance: currentUser.wallet_balance - masterclass.price,
            wallet_transactions: [...currentUser.wallet_transactions, purchaseTransaction],
            purchased_masterclass_ids: [...(currentUser.purchased_masterclass_ids || []), masterclass.id],
        };

        const updatedOwner = {
            ...owner,
            wallet_balance: owner.wallet_balance + payoutTransaction.amount,
            wallet_transactions: [...owner.wallet_transactions, payoutTransaction],
            sessions_completed: owner.sessions_completed + 1, // Increment for ranking
        };

        const allUsers = [...artists, ...engineers, ...producers, ...stoodioz];
        const updatedUsers = allUsers.map(u => {
            if (u.id === updatedCurrentUser.id) return updatedCurrentUser;
            if (u.id === updatedOwner.id) return updatedOwner;
            return u;
        });

        // 3. Dispatch updates
        dispatch({ type: ActionTypes.UPDATE_USERS, payload: { users: updatedUsers as any }});
        
        // 4. Close purchase modal and open watch modal
        dispatch({ type: ActionTypes.CLOSE_PURCHASE_MASTERCLASS_MODAL });
        setTimeout(() => {
            dispatch({ type: ActionTypes.OPEN_WATCH_MASTERCLASS_MODAL, payload: { masterclass, owner } });
        }, 300);

    }, [currentUser, masterclassToPurchase, artists, engineers, producers, stoodioz, dispatch]);

    const submitMasterclassReview = useCallback((rating: number, comment: string) => {
        if (!currentUser || !masterclassToReview) return;
        const { masterclass, owner } = masterclassToReview;

        // 1. Create new review
        const newReview: Review = {
            id: `rev-mc-${Date.now()}`,
            masterclassId: masterclass.id,
            reviewerName: currentUser.name,
            rating,
            comment,
            date: new Date().toISOString(),
            [owner.hasOwnProperty('specialties') ? 'engineerId' : 'producerId']: owner.id
        };

        const updatedReviews = [...reviews, newReview];

        // 2. Recalculate owner's rating
        const allOwnerReviews = updatedReviews.filter(r => r.engineerId === owner.id || r.producerId === owner.id);
        const newAverageRating = allOwnerReviews.reduce((sum, r) => sum + r.rating, 0) / allOwnerReviews.length;

        const updatedOwner = { ...owner, rating_overall: newAverageRating };

        // 3. Dispatch updates
        const allUsers = [...artists, ...engineers, ...producers, ...stoodioz];
        const updatedUsers = allUsers.map(u => u.id === owner.id ? updatedOwner : u);
        
        dispatch({ type: ActionTypes.SET_REVIEWS, payload: { reviews: updatedReviews } });
        dispatch({ type: ActionTypes.UPDATE_USERS, payload: { users: updatedUsers as any }});

        // 4. Close modal
        dispatch({ type: ActionTypes.CLOSE_REVIEW_MASTERCLASS_MODAL });

    }, [currentUser, masterclassToReview, reviews, artists, engineers, producers, stoodioz, dispatch]);

    return { 
        openPurchaseMasterclassModal, 
        openWatchMasterclassModal,
        confirmMasterclassPurchase,
        submitMasterclassReview,
    };
};