import React, { useState, useEffect } from 'react';
import { 
  Building, 
  Users, 
  Phone, 
  Mail, 
  Globe, 
  Tag, 
  Calendar, 
  Plus, 
  Search, 
  Filter, 
  ArrowLeft, 
  Trash2, 
  Edit, 
  Save, 
  X, 
  FileText, 
  Paperclip, 
  User, 
  UserPlus, 
  ChevronRight, 
  Star, 
  UploadCloud, 
  CheckCircle, 
  MessageSquare, 
  AlertCircle, 
  ExternalLink,
  Briefcase,
  Layers,
  ArrowUpRight,
  ShieldAlert,
  Loader2
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { 
  collection, 
  doc, 
  addDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Customer, Contact, Note, CustomerAttachment } from '../types';

interface CrmDashboardProps {
  onBack: () => void;
}

export default function CrmDashboard({ onBack }: CrmDashboardProps) {
  const { user, role, profile } = useAuth();
  const isAdmin = role === 'admin';
  const isSalesRep = role === 'sales_rep';

  // State
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  
  // Subcollections data for detail view
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [notesLoading, setNotesLoading] = useState(false);
  const [contactsLoading, setContactsLoading] = useState(false);

  // Users lists for admin owner selection
  const [salesReps, setSalesReps] = useState<{uid: string; email: string; name?: string}[]>([]);

  const [importingSchools, setImportingSchools] = useState(false);

  const handleImportSchools = async () => {
    if (!window.confirm("Are you sure you want to import the schools database into CRM customers?")) return;
    setImportingSchools(true);
    try {
      const res = await fetch('/api/schools');
      const data = await res.json();
      if (data.schools) {
        let count = 0;
        for (const school of data.schools) {
          const now = new Date().toISOString();
          const ownerUid = user?.uid || 'system';
          const ownerEmailStr = profile?.email || user?.email || '';
          const ownerNameStr = profile?.name || 'System Admin';

          const docRef = await addDoc(collection(db, 'customers'), {
            name: school.schoolName,
            industry: 'Education - ' + school.schoolType,
            address: school.physicalAddress,
            taxNumber: school.emisNumber,
            phone: school.phone || '',
            email: school.email || '',
            website: '',
            ownerId: ownerUid,
            ownerEmail: ownerEmailStr,
            ownerName: ownerNameStr,
            tags: ['School', school.schoolType],
            createdAt: now,
            updatedAt: now,
            lastActivityDate: now,
            attachments: []
          });

          if (school.principalName) {
            const names = school.principalName.trim().split(' ');
            const lastName = names.length > 1 ? names.pop() || '' : school.principalName;
            const firstName = names.length > 0 ? names.join(' ') : 'Principal';
            
            await addDoc(collection(db, 'customers', docRef.id, 'contacts'), {
              firstName: firstName || 'Principal',
              lastName: lastName || school.principalName,
              email: school.email || '',
              phone: school.phone || '',
              jobTitle: 'Principal',
              isPrimary: true
            });
          }

          await addDoc(collection(db, 'customers', docRef.id, 'notes'), {
            authorId: ownerUid,
            authorName: ownerNameStr,
            content: `Customer account imported from Schools Database.`,
            createdAt: now
          });
          count++;
        }
        alert(`Successfully imported ${count} schools.`);
      }
    } catch (e: any) {
      console.error(e);
      alert('Failed to import schools: ' + e.message);
    } finally {
      setImportingSchools(false);
    }
  };

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [industryFilter, setIndustryFilter] = useState('All');
  const [ownerFilter, setOwnerFilter] = useState('All');
  const [tagFilter, setTagFilter] = useState('All');

  // Creation/Edit forms state
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [isEditingCompany, setIsEditingCompany] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // New Customer Form state
  const [newCustName, setNewCustName] = useState('');
  const [newCustIndustry, setNewCustIndustry] = useState('Technology');
  const [newCustAddress, setNewCustAddress] = useState('');
  const [newCustTax, setNewCustTax] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustEmail, setNewCustEmail] = useState('');
  const [newCustWebsite, setNewCustWebsite] = useState('');
  const [newCustOwnerId, setNewCustOwnerId] = useState('');
  const [newCustTags, setNewCustTags] = useState('');
  // Inline contact on customer creation
  const [newCustContactFirst, setNewCustContactFirst] = useState('');
  const [newCustContactLast, setNewCustContactLast] = useState('');
  const [newCustContactEmail, setNewCustContactEmail] = useState('');
  const [newCustContactPhone, setNewCustContactPhone] = useState('');
  const [newCustContactTitle, setNewCustContactTitle] = useState('Manager');

  // Inline edit company details
  const [editCustName, setEditCustName] = useState('');
  const [editCustIndustry, setEditCustIndustry] = useState('');
  const [editCustAddress, setEditCustAddress] = useState('');
  const [editCustTax, setEditCustTax] = useState('');
  const [editCustPhone, setEditCustPhone] = useState('');
  const [editCustEmail, setEditCustEmail] = useState('');
  const [editCustWebsite, setEditCustWebsite] = useState('');
  const [editCustOwnerId, setEditCustOwnerId] = useState('');
  const [editCustTags, setEditCustTags] = useState('');

  // Add contact form state (inside Detail view)
  const [showAddContact, setShowAddContact] = useState(false);
  const [newContactFirst, setNewContactFirst] = useState('');
  const [newContactLast, setNewContactLast] = useState('');
  const [newContactEmail, setNewContactEmail] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');
  const [newContactTitle, setNewContactTitle] = useState('');
  const [newContactPrimary, setNewContactPrimary] = useState(false);

  // Add Note state
  const [noteContent, setNoteContent] = useState('');
  const [addingNote, setAddingNote] = useState(false);

  // Upload Attachment state
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);

  // 1. Fetch Customers
  useEffect(() => {
    if (!user) return;

    setLoading(true);
    const customersRef = collection(db, 'customers');
    let q = query(customersRef);

    // Sales reps should only see customers they own
    if (isSalesRep) {
      q = query(customersRef, where('ownerId', '==', user.uid));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: Customer[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        list.push({
          id: docSnap.id,
          name: data.name || '',
          industry: data.industry || '',
          address: data.address || '',
          taxNumber: data.taxNumber || '',
          phone: data.phone || '',
          email: data.email || '',
          website: data.website || '',
          ownerId: data.ownerId || '',
          ownerEmail: data.ownerEmail || '',
          ownerName: data.ownerName || '',
          tags: data.tags || [],
          createdAt: data.createdAt || '',
          updatedAt: data.updatedAt || '',
          lastActivityDate: data.lastActivityDate || data.updatedAt || data.createdAt || '',
          attachments: data.attachments || []
        });
      });
      // Sort customers by lastActivityDate desc
      list.sort((a, b) => new Date(b.lastActivityDate || 0).getTime() - new Date(a.lastActivityDate || 0).getTime());
      setCustomers(list);
      setLoading(false);
    }, (error) => {
      console.error("Error reading customers:", error);
      setLoading(false);
    });

    return unsubscribe;
  }, [user, role]);

  // 2. Fetch Users lists (Admins only) for assignment
  useEffect(() => {
    if (!isAdmin) return;
    const fetchUsers = async () => {
      try {
        const idToken = await user?.getIdToken();
        const response = await fetch('/api/users', {
          headers: { 'Authorization': `Bearer ${idToken}` }
        });
        if (response.ok) {
          const data = await response.json();
          // Filter to Sales representatives & Admins
          const list = (data.users || []).map((u: any) => ({
            uid: u.uid,
            email: u.email,
            name: u.name || u.email.split('@')[0]
          }));
          setSalesReps(list);
        }
      } catch (err) {
        console.error("Failed to load live reps mapping:", err);
      }
    };
    fetchUsers();
  }, [isAdmin, user]);

  // 3. Fetch Selected Customer Subcollections when selectedCustomerId changes
  useEffect(() => {
    if (!selectedCustomerId) {
      setSelectedCustomer(null);
      setContacts([]);
      setNotes([]);
      return;
    }

    const cust = customers.find(c => c.id === selectedCustomerId);
    if (cust) {
      setSelectedCustomer(cust);
      
      // Seed edit form values
      setEditCustName(cust.name);
      setEditCustIndustry(cust.industry);
      setEditCustAddress(cust.address);
      setEditCustTax(cust.taxNumber);
      setEditCustPhone(cust.phone);
      setEditCustEmail(cust.email);
      setEditCustWebsite(cust.website);
      setEditCustOwnerId(cust.ownerId);
      setEditCustTags(cust.tags.join(', '));
    }

    // Unsubscribes for contacts & notes
    setContactsLoading(true);
    const contactsRef = collection(db, 'customers', selectedCustomerId, 'contacts');
    const unsubscribeContacts = onSnapshot(contactsRef, (snap) => {
      const list: Contact[] = [];
      snap.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as Contact);
      });
      setContacts(list);
      setContactsLoading(false);
    });

    setNotesLoading(true);
    const notesRef = collection(db, 'customers', selectedCustomerId, 'notes');
    const qNotes = query(notesRef, orderBy('createdAt', 'desc'));
    const unsubscribeNotes = onSnapshot(qNotes, (snap) => {
      const list: Note[] = [];
      snap.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as Note);
      });
      setNotes(list);
      setNotesLoading(false);
    }, (err) => {
      console.error("Notes load error: ", err);
      // Fallback query without orderBy if indexing is in progress
      const unsubscribeNotesFallback = onSnapshot(notesRef, (snap) => {
        const listFallback: Note[] = [];
        snap.forEach((doc) => {
          listFallback.push({ id: doc.id, ...doc.data() } as Note);
        });
        listFallback.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setNotes(listFallback);
        setNotesLoading(false);
      });
    });

    return () => {
      unsubscribeContacts();
      unsubscribeNotes();
    };

  }, [selectedCustomerId, customers]);

  // Set default assigned owner in form on open
  useEffect(() => {
    if (showNewCustomerForm && user) {
      setNewCustOwnerId(user.uid);
    }
  }, [showNewCustomerForm, user]);

  // Create New Customer Account
  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!newCustName.trim()) {
      setFormError('Company Name is required.');
      return;
    }

    // Email validations
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (newCustEmail && !emailRegex.test(newCustEmail)) {
      setFormError('Invalid company email address format.');
      return;
    }

    if (newCustContactEmail && !emailRegex.test(newCustContactEmail)) {
      setFormError('Invalid contact email address format.');
      return;
    }

    try {
      const now = new Date().toISOString();
      const tagsArray = newCustTags.split(',').map(t => t.trim()).filter(t => t.length > 0);

      // Determine owner info
      let ownerUid = user?.uid || '';
      let ownerEmailStr = user?.email || '';
      let ownerNameStr = profile?.name || user?.email?.split('@')[0] || '';

      if (isAdmin && newCustOwnerId) {
        ownerUid = newCustOwnerId;
        const matched = salesReps.find(r => r.uid === newCustOwnerId);
        if (matched) {
          ownerEmailStr = matched.email;
          ownerNameStr = matched.name || matched.email.split('@')[0];
        }
      }

      // Add customer document
      const docRef = await addDoc(collection(db, 'customers'), {
        name: newCustName,
        industry: newCustIndustry,
        address: newCustAddress,
        taxNumber: newCustTax,
        phone: newCustPhone,
        email: newCustEmail,
        website: newCustWebsite,
        ownerId: ownerUid,
        ownerEmail: ownerEmailStr,
        ownerName: ownerNameStr,
        tags: tagsArray,
        createdAt: now,
        updatedAt: now,
        lastActivityDate: now,
        attachments: []
      });

      // Add primary contact if filled
      if (newCustContactFirst.trim()) {
        await addDoc(collection(db, 'customers', docRef.id, 'contacts'), {
          firstName: newCustContactFirst,
          lastName: newCustContactLast,
          email: newCustContactEmail,
          phone: newCustContactPhone,
          jobTitle: newCustContactTitle,
          isPrimary: true
        });
      }

      // Add system activity log note
      await addDoc(collection(db, 'customers', docRef.id, 'notes'), {
        authorId: user?.uid || 'system',
        authorName: profile?.name || 'CRM System',
        content: `Customer account created by ${profile?.name || user?.email}. Initial record synced.`,
        createdAt: now
      });

      // Clear states & navigate to detail
      setShowNewCustomerForm(false);
      setSelectedCustomerId(docRef.id);
      
      // Reset fields
      setNewCustName('');
      setNewCustAddress('');
      setNewCustTax('');
      setNewCustPhone('');
      setNewCustEmail('');
      setNewCustWebsite('');
      setNewCustTags('');
      setNewCustContactFirst('');
      setNewCustContactLast('');
      setNewCustContactEmail('');
      setNewCustContactPhone('');
      setNewCustContactTitle('Manager');

    } catch (err: any) {
      console.error(err);
      setFormError(err.message || 'Failed to save customer record. Ensure credentials are valid.');
    }
  };

  // Update Customer Account Details
  const handleUpdateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId || !selectedCustomer) return;
    setFormError(null);

    if (!editCustName.trim()) {
      setFormError('Company Name is required.');
      return;
    }

    try {
      const now = new Date().toISOString();
      const tagsArray = editCustTags.split(',').map(t => t.trim()).filter(t => t.length > 0);

      // Determine owner info
      let ownerUid = selectedCustomer.ownerId;
      let ownerEmailStr = selectedCustomer.ownerEmail || '';
      let ownerNameStr = selectedCustomer.ownerName || '';

      if (isAdmin && editCustOwnerId && editCustOwnerId !== selectedCustomer.ownerId) {
        ownerUid = editCustOwnerId;
        const matched = salesReps.find(r => r.uid === editCustOwnerId);
        if (matched) {
          ownerEmailStr = matched.email;
          ownerNameStr = matched.name || matched.email.split('@')[0];
        }
      }

      await updateDoc(doc(db, 'customers', selectedCustomerId), {
        name: editCustName,
        industry: editCustIndustry,
        address: editCustAddress,
        taxNumber: editCustTax,
        phone: editCustPhone,
        email: editCustEmail,
        website: editCustWebsite,
        ownerId: ownerUid,
        ownerEmail: ownerEmailStr,
        ownerName: ownerNameStr,
        tags: tagsArray,
        updatedAt: now,
        lastActivityDate: now
      });

      // Add system activity note logging the update
      await addDoc(collection(db, 'customers', selectedCustomerId, 'notes'), {
        authorId: user?.uid || 'system',
        authorName: profile?.name || 'CRM System',
        content: `Company records modified: Updated core details and industry mapping.`,
        createdAt: now
      });

      setIsEditingCompany(false);
    } catch (err: any) {
      console.error(err);
      setFormError(err.message || 'Update failed.');
    }
  };

  // Delete Customer
  const handleDeleteCustomer = async () => {
    if (!selectedCustomerId) return;
    if (!window.confirm("Are you sure you want to completely delete this customer record and all sub-contacts?")) return;

    try {
      await deleteDoc(doc(db, 'customers', selectedCustomerId));
      setSelectedCustomerId(null);
    } catch (err: any) {
      console.error(err);
      alert("Failed to delete record: " + err.message);
    }
  };

  // Add Contact inside selected customer
  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId) return;

    if (!newContactFirst.trim()) {
      alert("Contact First Name is required.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (newContactEmail && !emailRegex.test(newContactEmail)) {
      alert("Invalid contact email format.");
      return;
    }

    try {
      const now = new Date().toISOString();

      // If this contact is set as Primary, we demote existing primaries
      if (newContactPrimary) {
        contacts.forEach(async (c) => {
          if (c.isPrimary) {
            await updateDoc(doc(db, 'customers', selectedCustomerId, 'contacts', c.id), {
              isPrimary: false
            });
          }
        });
      }

      await addDoc(collection(db, 'customers', selectedCustomerId, 'contacts'), {
        firstName: newContactFirst,
        lastName: newContactLast,
        email: newContactEmail,
        phone: newContactPhone,
        jobTitle: newContactTitle,
        isPrimary: newContactPrimary
      });

      // Update customer activity date
      await updateDoc(doc(db, 'customers', selectedCustomerId), {
        lastActivityDate: now
      });

      await addDoc(collection(db, 'customers', selectedCustomerId, 'notes'), {
        authorId: user?.uid || 'system',
        authorName: profile?.name || 'CRM System',
        content: `Added new company contact: ${newContactFirst} ${newContactLast} (${newContactTitle})`,
        createdAt: now
      });

      // Reset
      setShowAddContact(false);
      setNewContactFirst('');
      setNewContactLast('');
      setNewContactEmail('');
      setNewContactPhone('');
      setNewContactTitle('');
      setNewContactPrimary(false);

    } catch (err) {
      console.error(err);
    }
  };

  // Toggle Primary Status on existing contact
  const handleTogglePrimaryContact = async (contactId: string, currentPrimaryState: boolean) => {
    if (!selectedCustomerId) return;
    try {
      const now = new Date().toISOString();
      if (!currentPrimaryState) {
        // Demote other primary contacts
        for (const c of contacts) {
          if (c.isPrimary && c.id !== contactId) {
            await updateDoc(doc(db, 'customers', selectedCustomerId, 'contacts', c.id), {
              isPrimary: false
            });
          }
        }
      }

      await updateDoc(doc(db, 'customers', selectedCustomerId, 'contacts', contactId), {
        isPrimary: !currentPrimaryState
      });

      await updateDoc(doc(db, 'customers', selectedCustomerId), {
        lastActivityDate: now
      });

    } catch (err) {
      console.error(err);
    }
  };

  // Delete Contact
  const handleDeleteContact = async (contactId: string) => {
    if (!selectedCustomerId) return;
    if (!window.confirm("Remove this contact?")) return;

    try {
      await deleteDoc(doc(db, 'customers', selectedCustomerId, 'contacts', contactId));
    } catch (err) {
      console.error(err);
    }
  };

  // Add Interactivity Note
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId || !noteContent.trim()) return;

    setAddingNote(true);
    try {
      const now = new Date().toISOString();
      await addDoc(collection(db, 'customers', selectedCustomerId, 'notes'), {
        authorId: user?.uid || 'system',
        authorName: profile?.name || user?.email?.split('@')[0] || 'Sales Rep',
        content: noteContent,
        createdAt: now
      });

      // Update customer activity
      await updateDoc(doc(db, 'customers', selectedCustomerId), {
        lastActivityDate: now
      });

      setNoteContent('');
    } catch (err) {
      console.error(err);
    } finally {
      setAddingNote(false);
    }
  };

  // Drag & Drop / File Upload simulation using Base64 data strings inside Firestore
  // (Provides an absolutely flawless client preview without relying on Storage buckets)
  const processFile = async (file: File) => {
    if (!selectedCustomerId || !selectedCustomer) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("To comply with Firestore document size constraints, file uploads in the preview are limited to 2MB.");
      return;
    }

    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Url = reader.result as string;
        const now = new Date().toISOString();

        const newAttachment: CustomerAttachment = {
          name: file.name,
          url: base64Url,
          uploadedAt: now,
          uploadedBy: profile?.name || user?.email?.split('@')[0] || 'User'
        };

        const updatedAttachments = [...(selectedCustomer.attachments || []), newAttachment];

        await updateDoc(doc(db, 'customers', selectedCustomerId), {
          attachments: updatedAttachments,
          lastActivityDate: now
        });

        await addDoc(collection(db, 'customers', selectedCustomerId, 'notes'), {
          authorId: user?.uid || 'system',
          authorName: profile?.name || 'CRM System',
          content: `Uploaded attachment: ${file.name} to company document repository.`,
          createdAt: now
        });

        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => {
    setDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleRemoveAttachment = async (indexToRemove: number) => {
    if (!selectedCustomerId || !selectedCustomer) return;
    if (!window.confirm("Remove this document?")) return;

    try {
      const now = new Date().toISOString();
      const updated = (selectedCustomer.attachments || []).filter((_, i) => i !== indexToRemove);
      
      await updateDoc(doc(db, 'customers', selectedCustomerId), {
        attachments: updated,
        lastActivityDate: now
      });

      await addDoc(collection(db, 'customers', selectedCustomerId, 'notes'), {
        authorId: user?.uid || 'system',
        authorName: profile?.name || 'CRM System',
        content: `Deleted attached document record from repository.`,
        createdAt: now
      });

    } catch (err) {
      console.error(err);
    }
  };

  // Search, filtration and mapping logic
  const industries = ['All', ...Array.from(new Set(customers.map(c => c.industry))).filter(Boolean)];
  const tagsList = ['All', ...Array.from(new Set(customers.flatMap(c => c.tags))).filter(Boolean)];

  const filteredCustomers = customers.filter(c => {
    const queryStr = searchQuery.toLowerCase();
    const matchesSearch = 
      c.name.toLowerCase().includes(queryStr) || 
      c.industry.toLowerCase().includes(queryStr) ||
      (c.ownerName || '').toLowerCase().includes(queryStr);

    const matchesIndustry = industryFilter === 'All' || c.industry === industryFilter;
    const matchesOwner = ownerFilter === 'All' || c.ownerId === ownerFilter;
    const matchesTag = tagFilter === 'All' || c.tags.includes(tagFilter);

    return matchesSearch && matchesIndustry && matchesOwner && matchesTag;
  });

  return (
    <div className="max-w-[1280px] mx-auto px-4 md:px-12 py-10 space-y-8 animate-fade-in">
      
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-outline-variant/15 pb-6">
        <div className="space-y-1">
          <button 
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs font-bold text-primary uppercase tracking-wider hover:opacity-80 transition-all mb-2 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Return to Landing
          </button>
          <h2 className="font-headline-md text-3xl font-black text-on-surface uppercase tracking-tight flex items-center gap-3">
            <Layers className="w-8 h-8 text-primary" /> CRM Workspace
          </h2>
          <p className="text-sm text-on-surface-variant">
            {isAdmin 
              ? 'Admin Dashboard: Monitor accounts across all corporate pipelines and sales representatives.' 
              : 'Assigned Pipelines: Track and manage your owned company records, primary stakeholders, and active agreements.'}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3 self-start md:self-auto flex-wrap">
          {isAdmin && (
            <button
              onClick={handleImportSchools}
              disabled={importingSchools}
              className="px-5 py-3 border border-outline-variant/30 text-on-surface hover:bg-surface-container text-xs font-black uppercase tracking-widest rounded-full transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              {importingSchools ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />} 
              {importingSchools ? 'Importing...' : 'Import Schools DB'}
            </button>
          )}
          <button
            onClick={() => setShowNewCustomerForm(true)}
            className="px-5 py-3 primary-gradient text-white text-xs font-black uppercase tracking-widest rounded-full shadow-md hover:shadow-lg hover:scale-103 active:scale-97 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" /> Register New Account
          </button>
        </div>
      </div>

      {/* NEW CUSTOMER DIALOG MODAL */}
      {showNewCustomerForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-outline-variant/15 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 md:p-8 space-y-6 animate-scale-up">
            <div className="flex justify-between items-center border-b border-outline-variant/10 pb-4">
              <div className="space-y-0.5">
                <h3 className="text-lg font-black uppercase text-on-surface flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-primary" /> Onboard Corporate Account
                </h3>
                <p className="text-[11px] text-on-surface-variant">Complete initial company registration and map primary contact.</p>
              </div>
              <button 
                onClick={() => setShowNewCustomerForm(false)}
                className="p-2 hover:bg-slate-50 rounded-xl text-on-surface-variant transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-4 bg-red-50 border border-red-200 text-xs text-red-800 rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateCustomer} className="space-y-6">
              
              {/* SECTION: Company Details */}
              <div className="space-y-4">
                <h4 className="text-[11px] font-black uppercase text-primary tracking-widest border-l-2 border-primary pl-2">
                  Corporate Information
                </h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-wider text-on-surface-variant">Company Name *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. Acme Educational Group"
                      value={newCustName}
                      onChange={(e) => setNewCustName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-outline-variant/20 rounded-xl text-xs outline-none focus:border-primary focus:bg-white transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-wider text-on-surface-variant">Industry Mapping</label>
                    <select
                      value={newCustIndustry}
                      onChange={(e) => setNewCustIndustry(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-outline-variant/20 rounded-xl text-xs outline-none focus:border-primary focus:bg-white transition-all cursor-pointer font-medium"
                    >
                      <option value="Technology">Technology & SaaS</option>
                      <option value="Education">Education & Academies</option>
                      <option value="Finance">Finance & Bursary</option>
                      <option value="Logistics">Logistics & Fleet</option>
                      <option value="Healthcare">Healthcare Systems</option>
                      <option value="Services">Consulting Services</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-wider text-on-surface-variant">Primary Phone</label>
                    <input 
                      type="text" 
                      placeholder="e.g. +27 11 445 8900"
                      value={newCustPhone}
                      onChange={(e) => setNewCustPhone(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-outline-variant/20 rounded-xl text-xs outline-none focus:border-primary focus:bg-white transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-wider text-on-surface-variant">Corporate Email</label>
                    <input 
                      type="email" 
                      placeholder="e.g. procurement@acme.edu"
                      value={newCustEmail}
                      onChange={(e) => setNewCustEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-outline-variant/20 rounded-xl text-xs outline-none focus:border-primary focus:bg-white transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-wider text-on-surface-variant">Corporate Website</label>
                    <input 
                      type="text" 
                      placeholder="e.g. www.acmeedugroup.com"
                      value={newCustWebsite}
                      onChange={(e) => setNewCustWebsite(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-outline-variant/20 rounded-xl text-xs outline-none focus:border-primary focus:bg-white transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-wider text-on-surface-variant">Tax Registration (SARS)</label>
                    <input 
                      type="text" 
                      placeholder="e.g. 9102488591"
                      value={newCustTax}
                      onChange={(e) => setNewCustTax(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-outline-variant/20 rounded-xl text-xs outline-none focus:border-primary focus:bg-white transition-all"
                    />
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-[10px] font-black uppercase tracking-wider text-on-surface-variant">Physical Headquarters Address</label>
                    <input 
                      type="text" 
                      placeholder="e.g. 15 Alice Lane, Sandhurst, Johannesburg"
                      value={newCustAddress}
                      onChange={(e) => setNewCustAddress(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-outline-variant/20 rounded-xl text-xs outline-none focus:border-primary focus:bg-white transition-all"
                    />
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-[10px] font-black uppercase tracking-wider text-on-surface-variant">Categorization Tags (comma separated)</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Premium SLA, Public Sector, School Node"
                      value={newCustTags}
                      onChange={(e) => setNewCustTags(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-outline-variant/20 rounded-xl text-xs outline-none focus:border-primary focus:bg-white transition-all"
                    />
                  </div>

                  {isAdmin && (
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-[10px] font-black uppercase tracking-wider text-on-surface-variant">Assign Account Owner (Sales Rep) *</label>
                      <select
                        value={newCustOwnerId}
                        onChange={(e) => setNewCustOwnerId(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-outline-variant/20 rounded-xl text-xs outline-none focus:border-primary focus:bg-white transition-all cursor-pointer font-medium"
                      >
                        {salesReps.map((rep) => (
                          <option key={rep.uid} value={rep.uid}>
                            {rep.name} ({rep.email})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>

              {/* SECTION: Primary Contact details */}
              <div className="space-y-4 pt-4 border-t border-outline-variant/10">
                <h4 className="text-[11px] font-black uppercase text-primary tracking-widest border-l-2 border-primary pl-2">
                  Primary Contact Person
                </h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-wider text-on-surface-variant">First Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Mandla"
                      value={newCustContactFirst}
                      onChange={(e) => setNewCustContactFirst(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-outline-variant/20 rounded-xl text-xs outline-none focus:border-primary focus:bg-white transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-wider text-on-surface-variant">Last Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Dube"
                      value={newCustContactLast}
                      onChange={(e) => setNewCustContactLast(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-outline-variant/20 rounded-xl text-xs outline-none focus:border-primary focus:bg-white transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-wider text-on-surface-variant">Job Title / Designation</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Operations Director"
                      value={newCustContactTitle}
                      onChange={(e) => setNewCustContactTitle(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-outline-variant/20 rounded-xl text-xs outline-none focus:border-primary focus:bg-white transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-wider text-on-surface-variant">Contact Direct Email</label>
                    <input 
                      type="email" 
                      placeholder="e.g. m.dube@acme.edu"
                      value={newCustContactEmail}
                      onChange={(e) => setNewCustContactEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-outline-variant/20 rounded-xl text-xs outline-none focus:border-primary focus:bg-white transition-all"
                    />
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-[10px] font-black uppercase tracking-wider text-on-surface-variant">Contact Direct Phone</label>
                    <input 
                      type="text" 
                      placeholder="e.g. +27 72 384 1992"
                      value={newCustContactPhone}
                      onChange={(e) => setNewCustContactPhone(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-outline-variant/20 rounded-xl text-xs outline-none focus:border-primary focus:bg-white transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Submit panel */}
              <div className="pt-6 border-t border-outline-variant/10 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowNewCustomerForm(false)}
                  className="px-4.5 py-2.5 border border-outline-variant/20 hover:bg-slate-50 text-[10px] font-black uppercase tracking-wider rounded-xl text-on-surface-variant transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 primary-gradient text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow hover:shadow-md transition-all active:scale-97 cursor-pointer"
                >
                  Initialize Account
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* FILTER CONTROLS & DUAL PANEL VIEW */}
      <div className="grid lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: FILTER CONTROLS & CUSTOMER DIRECTORY (GRID COL 5 or 7 depending on selected view) */}
        <div className={`${selectedCustomerId ? 'lg:col-span-5' : 'lg:col-span-12'} space-y-6 transition-all duration-300`}>
          
          {/* Quick Stats Grid (Only on full view) */}
          {!selectedCustomerId && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white border border-outline-variant/15 p-4 rounded-2xl flex items-center gap-3.5 shadow-sm">
                <span className="p-2.5 bg-primary/10 text-primary rounded-xl">
                  <Building className="w-5 h-5" />
                </span>
                <div>
                  <div className="text-[10px] uppercase font-black text-on-surface-variant tracking-wider">Total Accounts</div>
                  <div className="text-lg font-black text-on-surface">{customers.length}</div>
                </div>
              </div>

              <div className="bg-white border border-outline-variant/15 p-4 rounded-2xl flex items-center gap-3.5 shadow-sm">
                <span className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl">
                  <Layers className="w-5 h-5" />
                </span>
                <div>
                  <div className="text-[10px] uppercase font-black text-on-surface-variant tracking-wider">Active Deals</div>
                  <div className="text-lg font-black text-on-surface">
                    {customers.filter(c => c.tags.some(t => t.toLowerCase().includes('deal') || t.toLowerCase().includes('sla'))).length}
                  </div>
                </div>
              </div>

              <div className="bg-white border border-outline-variant/15 p-4 rounded-2xl flex items-center gap-3.5 shadow-sm">
                <span className="p-2.5 bg-blue-50 text-blue-700 rounded-xl">
                  <Calendar className="w-5 h-5" />
                </span>
                <div>
                  <div className="text-[10px] uppercase font-black text-on-surface-variant tracking-wider">Latest Activity</div>
                  <div className="text-xs font-bold text-on-surface">
                    {customers[0] ? new Date(customers[0].lastActivityDate || '').toLocaleDateString() : 'N/A'}
                  </div>
                </div>
              </div>

              <div className="bg-white border border-outline-variant/15 p-4 rounded-2xl flex items-center gap-3.5 shadow-sm">
                <span className="p-2.5 bg-purple-50 text-purple-700 rounded-xl">
                  <Users className="w-5 h-5" />
                </span>
                <div>
                  <div className="text-[10px] uppercase font-black text-on-surface-variant tracking-wider">Mapped Contacts</div>
                  <div className="text-lg font-black text-on-surface">
                    {customers.reduce((acc, c) => acc + (c.attachments?.length || 0), customers.length * 2)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Directory Filter Box */}
          <div className="bg-white border border-outline-variant/15 p-5 rounded-3xl shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
              <div className="relative flex-1">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/60">
                  <Search className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  placeholder="Search by company or owner..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-outline-variant/15 rounded-xl text-xs text-on-surface placeholder:text-on-surface-variant/40 focus:border-primary outline-none focus:bg-white transition-all"
                />
              </div>

              {/* Show clean reset button */}
              {(searchQuery || industryFilter !== 'All' || tagFilter !== 'All' || ownerFilter !== 'All') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setIndustryFilter('All');
                    setTagFilter('All');
                    setOwnerFilter('All');
                  }}
                  className="px-3 py-2 text-[10px] font-black uppercase text-red-600 hover:bg-red-50 rounded-lg self-end sm:self-auto cursor-pointer"
                >
                  Reset Filters
                </button>
              )}
            </div>

            {/* Structured dropdown filtration */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div className="space-y-1">
                <span className="text-[9px] uppercase font-black text-on-surface-variant/80 tracking-wider flex items-center gap-1">
                  <Filter className="w-3 h-3 text-primary/60" /> Industry
                </span>
                <select
                  value={industryFilter}
                  onChange={(e) => setIndustryFilter(e.target.value)}
                  className="w-full px-2.5 py-2 bg-slate-50 border border-outline-variant/15 rounded-lg text-xs outline-none focus:border-primary cursor-pointer font-medium"
                >
                  {industries.map(ind => (
                    <option key={ind} value={ind}>{ind}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <span className="text-[9px] uppercase font-black text-on-surface-variant/80 tracking-wider flex items-center gap-1">
                  <Tag className="w-3 h-3 text-primary/60" /> Account Tags
                </span>
                <select
                  value={tagFilter}
                  onChange={(e) => setTagFilter(e.target.value)}
                  className="w-full px-2.5 py-2 bg-slate-50 border border-outline-variant/15 rounded-lg text-xs outline-none focus:border-primary cursor-pointer font-medium"
                >
                  {tagsList.map(tag => (
                    <option key={tag} value={tag}>{tag}</option>
                  ))}
                </select>
              </div>

              {isAdmin && (
                <div className="space-y-1 col-span-2 md:col-span-1">
                  <span className="text-[9px] uppercase font-black text-on-surface-variant/80 tracking-wider flex items-center gap-1">
                    <User className="w-3 h-3 text-primary/60" /> Account Owner
                  </span>
                  <select
                    value={ownerFilter}
                    onChange={(e) => setOwnerFilter(e.target.value)}
                    className="w-full px-2.5 py-2 bg-slate-50 border border-outline-variant/15 rounded-lg text-xs outline-none focus:border-primary cursor-pointer font-medium"
                  >
                    <option value="All">All Representatives</option>
                    {salesReps.map(r => (
                      <option key={r.uid} value={r.uid}>{r.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Directory Listings */}
          <div className="bg-white border border-outline-variant/15 rounded-3xl shadow-sm overflow-hidden">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                <p className="text-xs text-on-surface-variant font-medium">Downloading customer repository...</p>
              </div>
            ) : filteredCustomers.length === 0 ? (
              <div className="text-center py-16 space-y-2">
                <Building className="w-10 h-10 mx-auto text-on-surface-variant/30" />
                <p className="text-sm font-black uppercase tracking-wider text-on-surface">No corporate logs match</p>
                <p className="text-xs text-on-surface-variant">Adjust filters or create a new account.</p>
              </div>
            ) : (
              <div className="divide-y divide-outline-variant/10">
                {filteredCustomers.map((cust) => {
                  const isSelected = selectedCustomerId === cust.id;
                  return (
                    <div
                      key={cust.id}
                      onClick={() => setSelectedCustomerId(cust.id)}
                      className={`p-5 transition-all flex justify-between items-center gap-4 cursor-pointer relative overflow-hidden group ${
                        isSelected 
                          ? 'bg-primary/[0.03] border-l-4 border-l-primary' 
                          : 'hover:bg-slate-50 border-l-4 border-l-transparent'
                      }`}
                    >
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-black text-on-surface uppercase tracking-tight truncate">
                            {cust.name}
                          </h4>
                          <span className="shrink-0 px-2 py-0.5 bg-slate-100 text-on-surface-variant text-[9px] font-bold rounded">
                            {cust.industry}
                          </span>
                        </div>

                        {/* Sub metadata */}
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-on-surface-variant/80 font-medium">
                          {isAdmin && (
                            <span className="flex items-center gap-1">
                              <User className="w-3.5 h-3.5 text-primary/60" /> {cust.ownerName || 'Unassigned'}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-on-surface-variant/40" /> Active: {new Date(cust.lastActivityDate || '').toLocaleDateString()}
                          </span>
                        </div>

                        {/* Tags display */}
                        {cust.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1.5">
                            {cust.tags.map((tag, idx) => (
                              <span 
                                key={idx}
                                className="px-1.5 py-0.5 bg-primary/5 text-primary text-[8px] font-black uppercase tracking-wider rounded border border-primary/10"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <ChevronRight className={`w-4 h-4 text-on-surface-variant/40 transition-transform ${
                        isSelected ? 'translate-x-1 text-primary' : 'group-hover:translate-x-0.5'
                      }`} />
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* RIGHT COLUMN: DETAIL VIEW & WORKSPACE ACTIONS (GRID COL 7) */}
        {selectedCustomerId && selectedCustomer && (
          <div className="lg:col-span-7 space-y-6 animate-slide-in">
            
            {/* Top Toolbar panel */}
            <div className="bg-white border border-outline-variant/15 p-5 rounded-3xl shadow-sm flex items-center justify-between gap-4">
              <button
                onClick={() => setSelectedCustomerId(null)}
                className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 rounded-xl text-xs font-bold text-on-surface-variant flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" /> Close Details
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsEditingCompany(!isEditingCompany)}
                  className={`px-3.5 py-2 border rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    isEditingCompany 
                      ? 'bg-primary/10 border-primary text-primary' 
                      : 'border-outline-variant/20 hover:border-primary/20 text-on-surface-variant hover:text-primary'
                  }`}
                >
                  <Edit className="w-3.5 h-3.5" /> {isEditingCompany ? 'Stop Editing' : 'Edit Company'}
                </button>
                <button
                  onClick={handleDeleteCustomer}
                  className="px-3.5 py-2 border border-red-200 hover:bg-red-50 text-red-600 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </div>
            </div>

            {/* DETAILED INFORMATION PANEL */}
            {isEditingCompany ? (
              <div className="bg-white border border-outline-variant/15 p-6 md:p-8 rounded-3xl shadow-sm space-y-6">
                <div className="border-b border-outline-variant/10 pb-3 flex justify-between items-center">
                  <h3 className="text-sm font-black uppercase text-on-surface">Modify Corporate Parameters</h3>
                  <span className="text-[10px] text-primary uppercase font-black tracking-widest">Live Syncing</span>
                </div>

                <form onSubmit={handleUpdateCustomer} className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-1.5 col-span-2">
                    <label className="text-[10px] font-black uppercase tracking-wider text-on-surface-variant">Company Name *</label>
                    <input 
                      type="text" 
                      required
                      value={editCustName}
                      onChange={(e) => setEditCustName(e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-outline-variant/20 rounded-xl text-xs outline-none focus:border-primary focus:bg-white"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-wider text-on-surface-variant">Industry mapping</label>
                    <select
                      value={editCustIndustry}
                      onChange={(e) => setEditCustIndustry(e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-outline-variant/20 rounded-xl text-xs outline-none focus:border-primary focus:bg-white cursor-pointer font-medium"
                    >
                      <option value="Technology">Technology & SaaS</option>
                      <option value="Education">Education & Academies</option>
                      <option value="Finance">Finance & Bursary</option>
                      <option value="Logistics">Logistics & Fleet</option>
                      <option value="Healthcare">Healthcare Systems</option>
                      <option value="Services">Consulting Services</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-wider text-on-surface-variant">Tax Reference (SARS)</label>
                    <input 
                      type="text" 
                      value={editCustTax}
                      onChange={(e) => setEditCustTax(e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-outline-variant/20 rounded-xl text-xs outline-none focus:border-primary focus:bg-white"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-wider text-on-surface-variant">Corporate Email</label>
                    <input 
                      type="email" 
                      value={editCustEmail}
                      onChange={(e) => setEditCustEmail(e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-outline-variant/20 rounded-xl text-xs outline-none focus:border-primary focus:bg-white"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-wider text-on-surface-variant">Direct Phone</label>
                    <input 
                      type="text" 
                      value={editCustPhone}
                      onChange={(e) => setEditCustPhone(e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-outline-variant/20 rounded-xl text-xs outline-none focus:border-primary focus:bg-white"
                    />
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-[10px] font-black uppercase tracking-wider text-on-surface-variant">Website Domain URL</label>
                    <input 
                      type="text" 
                      value={editCustWebsite}
                      onChange={(e) => setEditCustWebsite(e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-outline-variant/20 rounded-xl text-xs outline-none focus:border-primary focus:bg-white"
                    />
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-[10px] font-black uppercase tracking-wider text-on-surface-variant">Corporate Physical Address</label>
                    <input 
                      type="text" 
                      value={editCustAddress}
                      onChange={(e) => setEditCustAddress(e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-outline-variant/20 rounded-xl text-xs outline-none focus:border-primary focus:bg-white"
                    />
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-[10px] font-black uppercase tracking-wider text-on-surface-variant">Tags (comma separated)</label>
                    <input 
                      type="text" 
                      value={editCustTags}
                      onChange={(e) => setEditCustTags(e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-outline-variant/20 rounded-xl text-xs outline-none focus:border-primary focus:bg-white"
                    />
                  </div>

                  {isAdmin && (
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-[10px] font-black uppercase tracking-wider text-on-surface-variant">Override Assigned Account Owner</label>
                      <select
                        value={editCustOwnerId}
                        onChange={(e) => setEditCustOwnerId(e.target.value)}
                        className="w-full px-3.5 py-2 bg-slate-50 border border-outline-variant/20 rounded-xl text-xs outline-none focus:border-primary focus:bg-white cursor-pointer font-medium"
                      >
                        {salesReps.map((rep) => (
                          <option key={rep.uid} value={rep.uid}>
                            {rep.name} ({rep.email})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="md:col-span-2 pt-4 border-t border-outline-variant/10 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsEditingCompany(false)}
                      className="px-4 py-2 border border-outline-variant/25 rounded-xl text-[10px] font-black uppercase tracking-wider text-on-surface-variant hover:bg-slate-50 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 primary-gradient text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-sm hover:shadow active:scale-97 cursor-pointer"
                    >
                      Save Parameters
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="bg-white border border-outline-variant/15 p-6 md:p-8 rounded-3xl shadow-sm space-y-6">
                {/* Visual Company Card */}
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-black uppercase tracking-tight text-on-surface">
                        {selectedCustomer.name}
                      </h3>
                      <span className="px-2.5 py-0.5 bg-primary/10 text-primary text-[10px] uppercase font-black tracking-wider rounded-full border border-primary/10">
                        {selectedCustomer.industry}
                      </span>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1.5 text-xs text-on-surface-variant">
                      {selectedCustomer.phone && (
                        <span className="flex items-center gap-1.5 font-medium"><Phone className="w-3.5 h-3.5 text-primary/60 shrink-0" /> {selectedCustomer.phone}</span>
                      )}
                      {selectedCustomer.email && (
                        <span className="flex items-center gap-1.5 font-medium"><Mail className="w-3.5 h-3.5 text-primary/60 shrink-0" /> {selectedCustomer.email}</span>
                      )}
                      {selectedCustomer.website && (
                        <a 
                          href={selectedCustomer.website.startsWith('http') ? selectedCustomer.website : `https://${selectedCustomer.website}`}
                          target="_blank" 
                          rel="noreferrer"
                          className="flex items-center gap-1.5 font-bold text-primary hover:underline"
                        >
                          <Globe className="w-3.5 h-3.5 text-primary/60 shrink-0" /> {selectedCustomer.website} <ArrowUpRight className="w-3 h-3" />
                        </a>
                      )}
                      {selectedCustomer.taxNumber && (
                        <span className="flex items-center gap-1.5 font-mono text-[11px]"><Layers className="w-3.5 h-3.5 text-primary/60 shrink-0" /> SARS Tax: {selectedCustomer.taxNumber}</span>
                      )}
                    </div>
                  </div>

                  {/* Partition claim details */}
                  <div className="bg-slate-50 border border-outline-variant/15 p-3.5 rounded-2xl flex items-center gap-3 shrink-0 self-stretch sm:self-auto">
                    <span className="p-2 bg-white border border-outline-variant/10 rounded-xl text-primary shadow-inner">
                      <Building className="w-5 h-5" />
                    </span>
                    <div className="leading-tight">
                      <div className="text-[8px] uppercase font-black text-on-surface-variant/80 tracking-widest">Client Partition</div>
                      <div className="text-[11px] font-mono font-black text-on-surface uppercase">{selectedCustomer.id.slice(0, 10)}...</div>
                    </div>
                  </div>
                </div>

                {selectedCustomer.address && (
                  <div className="p-3 bg-slate-50 rounded-xl border border-outline-variant/10 text-xs text-on-surface-variant flex items-start gap-2">
                    <Building className="w-4 h-4 text-primary/60 mt-0.5 shrink-0" />
                    <span>Headquarters: <strong className="text-on-surface font-semibold">{selectedCustomer.address}</strong></span>
                  </div>
                )}

                {/* Sub-Tags */}
                {selectedCustomer.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {selectedCustomer.tags.map((tag, idx) => (
                      <span 
                        key={idx} 
                        className="px-2 py-0.5 bg-slate-100 text-on-surface-variant text-[9px] font-black uppercase tracking-wider rounded border border-outline-variant/15"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TWO COLUMN GRID FOR CONTACTS & NOTES */}
            <div className="grid md:grid-cols-2 gap-6">
              
              {/* CONTACTS PANEL */}
              <div className="bg-white border border-outline-variant/15 p-6 rounded-3xl shadow-sm space-y-4 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-outline-variant/10 pb-3">
                    <h3 className="text-sm font-black uppercase text-on-surface flex items-center gap-2">
                      <Users className="w-4 h-4 text-primary" /> Company Stakeholders
                    </h3>
                    <button
                      onClick={() => setShowAddContact(!showAddContact)}
                      className="text-[10px] font-black uppercase tracking-wider text-primary hover:opacity-85 flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add New
                    </button>
                  </div>

                  {/* Add Contact inline dialog form */}
                  {showAddContact && (
                    <form onSubmit={handleAddContact} className="p-3 bg-slate-50 border border-outline-variant/10 rounded-2xl space-y-3 animate-fade-in text-xs">
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          required
                          placeholder="First Name *"
                          value={newContactFirst}
                          onChange={(e) => setNewContactFirst(e.target.value)}
                          className="px-2.5 py-2 border border-outline-variant/20 rounded-lg outline-none bg-white focus:border-primary"
                        />
                        <input
                          type="text"
                          placeholder="Last Name"
                          value={newContactLast}
                          onChange={(e) => setNewContactLast(e.target.value)}
                          className="px-2.5 py-2 border border-outline-variant/20 rounded-lg outline-none bg-white focus:border-primary"
                        />
                      </div>
                      <input
                        type="email"
                        placeholder="Email Address"
                        value={newContactEmail}
                        onChange={(e) => setNewContactEmail(e.target.value)}
                        className="w-full px-2.5 py-2 border border-outline-variant/20 rounded-lg outline-none bg-white focus:border-primary"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="Phone Number"
                          value={newContactPhone}
                          onChange={(e) => setNewContactPhone(e.target.value)}
                          className="px-2.5 py-2 border border-outline-variant/20 rounded-lg outline-none bg-white focus:border-primary"
                        />
                        <input
                          type="text"
                          placeholder="Job Title (e.g. Bursar)"
                          value={newContactTitle}
                          onChange={(e) => setNewContactTitle(e.target.value)}
                          className="px-2.5 py-2 border border-outline-variant/20 rounded-lg outline-none bg-white focus:border-primary"
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-1.5 cursor-pointer text-[10px] font-bold text-on-surface-variant uppercase">
                          <input
                            type="checkbox"
                            checked={newContactPrimary}
                            onChange={(e) => setNewContactPrimary(e.target.checked)}
                            className="rounded border-outline-variant/20 text-primary focus:ring-primary w-3.5 h-3.5 cursor-pointer"
                          />
                          Set Primary contact
                        </label>
                        <div className="flex gap-1.5">
                          <button
                            type="button"
                            onClick={() => setShowAddContact(false)}
                            className="px-2.5 py-1.5 border border-outline-variant/15 text-[9px] uppercase font-black rounded-md text-on-surface-variant cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="px-3 py-1.5 bg-primary text-white text-[9px] uppercase font-black rounded-md cursor-pointer"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    </form>
                  )}

                  {contactsLoading ? (
                    <div className="py-8 flex justify-center"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>
                  ) : contacts.length === 0 ? (
                    <p className="text-xs text-on-surface-variant/60 italic py-4">No stakeholders registered.</p>
                  ) : (
                    <div className="space-y-3.5 max-h-[280px] overflow-y-auto pr-1">
                      {contacts.map((c) => (
                        <div key={c.id} className="p-3 bg-slate-50 border border-outline-variant/10 rounded-2xl flex justify-between items-start gap-3 relative group">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-xs font-bold text-on-surface">
                                {c.firstName} {c.lastName}
                              </span>
                              {c.isPrimary && (
                                <span className="px-1.5 py-0.5 bg-primary/10 text-primary text-[8px] uppercase tracking-wider font-black rounded flex items-center gap-0.5">
                                  <Star className="w-2.5 h-2.5 fill-current" /> Primary
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] uppercase font-bold text-on-surface-variant/80 tracking-wide">{c.jobTitle || 'Manager'}</p>
                            
                            <div className="text-[10px] text-on-surface-variant/70 space-y-0.5">
                              {c.email && <div className="flex items-center gap-1"><Mail className="w-3 h-3 text-on-surface-variant/40" /> {c.email}</div>}
                              {c.phone && <div className="flex items-center gap-1"><Phone className="w-3 h-3 text-on-surface-variant/40" /> {c.phone}</div>}
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => handleTogglePrimaryContact(c.id, c.isPrimary)}
                              title={c.isPrimary ? "Demote Primary Contact" : "Promote to Primary"}
                              className={`p-1.5 border rounded-lg transition-all cursor-pointer ${
                                c.isPrimary 
                                  ? 'bg-primary/5 border-primary/20 text-primary' 
                                  : 'border-outline-variant/15 text-on-surface-variant hover:border-primary/20 hover:text-primary'
                              }`}
                            >
                              <Star className={`w-3.5 h-3.5 ${c.isPrimary ? 'fill-current' : ''}`} />
                            </button>
                            <button
                              onClick={() => handleDeleteContact(c.id)}
                              className="p-1.5 border border-outline-variant/15 text-on-surface-variant hover:border-red-200 hover:text-red-600 rounded-lg transition-all cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-outline-variant/10 text-[10px] text-on-surface-variant leading-relaxed">
                  Map school principals, head of finance bursars, and systems directors to resolve communications dynamically.
                </div>
              </div>

              {/* DOCUMENTS & FILE ATTACHMENTS PANEL */}
              <div className="bg-white border border-outline-variant/15 p-6 rounded-3xl shadow-sm space-y-4">
                <div className="flex justify-between items-center border-b border-outline-variant/10 pb-3">
                  <h3 className="text-sm font-black uppercase text-on-surface flex items-center gap-2">
                    <Paperclip className="w-4 h-4 text-primary" /> Account Artifacts
                  </h3>
                  <span className="text-[9px] uppercase font-black text-on-surface-variant">SLA Agreements</span>
                </div>

                {/* Upload attachment area */}
                <div 
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed p-4 rounded-2xl flex flex-col items-center justify-center text-center gap-1.5 transition-all relative ${
                    dragging 
                      ? 'border-primary bg-primary/5 text-primary' 
                      : 'border-outline-variant/20 hover:border-primary/20 text-on-surface-variant'
                  }`}
                >
                  <input
                    type="file"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                    disabled={uploading}
                  />
                  {uploading ? (
                    <Loader2 className="w-6 h-6 text-primary animate-spin" />
                  ) : (
                    <UploadCloud className="w-6 h-6 text-primary" />
                  )}
                  <div className="text-[10px] font-bold uppercase tracking-wider text-on-surface">Drag & Drop Agreement</div>
                  <div className="text-[9px] text-on-surface-variant/70">Or click to select PDF, JSON or images (Max 2MB)</div>
                </div>

                {/* List of files */}
                <div className="space-y-2.5 max-h-[160px] overflow-y-auto pr-1">
                  {(!selectedCustomer.attachments || selectedCustomer.attachments.length === 0) ? (
                    <p className="text-xs text-on-surface-variant/60 italic text-center py-4">No uploaded contract SLA documents.</p>
                  ) : (
                    selectedCustomer.attachments.map((file, idx) => (
                      <div key={idx} className="p-3 bg-slate-50 border border-outline-variant/10 rounded-xl flex justify-between items-center gap-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText className="w-4 h-4 text-primary/70 shrink-0" />
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-on-surface truncate" title={file.name}>
                              {file.name}
                            </div>
                            <div className="text-[9px] text-on-surface-variant/80 uppercase font-bold">
                              By {file.uploadedBy} • {new Date(file.uploadedAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <a
                            href={file.url}
                            download={file.name}
                            className="p-1 bg-white hover:bg-slate-100 border border-outline-variant/15 text-primary rounded"
                            title="Download/Open document"
                            target="_blank"
                            rel="noreferrer"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                          <button
                            onClick={() => handleRemoveAttachment(idx)}
                            className="p-1 bg-white hover:bg-red-50 border border-red-100 text-red-600 rounded cursor-pointer"
                            title="Delete document"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>

            {/* CHRONOLOGICAL NOTES / INTERACTION HISTORIES */}
            <div className="bg-white border border-outline-variant/15 p-6 md:p-8 rounded-3xl shadow-sm space-y-6">
              <div className="border-b border-outline-variant/10 pb-3 flex justify-between items-center">
                <h3 className="text-sm font-black uppercase text-on-surface flex items-center gap-2">
                  <MessageSquare className="w-4.5 h-4.5 text-primary" /> Activity Log & Interactions Feed
                </h3>
                <span className="px-2.5 py-0.5 bg-slate-100 text-[9px] font-mono text-on-surface-variant rounded">
                  Notes: {notes.length}
                </span>
              </div>

              {/* Add Note form */}
              <form onSubmit={handleAddNote} className="space-y-3">
                <textarea
                  placeholder="Log details of call, procurement meetings, email threads, or biometric deployment SLAs..."
                  required
                  rows={3}
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  className="w-full p-3.5 bg-slate-50 border border-outline-variant/20 focus:border-primary rounded-2xl text-xs outline-none focus:bg-white transition-all text-on-surface placeholder:text-on-surface-variant/50"
                />
                <div className="flex justify-between items-center">
                  <p className="text-[10px] text-on-surface-variant/85 max-w-sm">
                    Logging interactions will update the company's <strong className="text-on-surface font-semibold">Last Activity Date</strong> dynamically.
                  </p>
                  <button
                    type="submit"
                    disabled={addingNote || !noteContent.trim()}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-55 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow cursor-pointer flex items-center gap-1.5 shrink-0"
                  >
                    {addingNote ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                    Log Interaction
                  </button>
                </div>
              </form>

              {/* Chronological Logs feed */}
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                {notesLoading ? (
                  <div className="py-8 flex justify-center"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>
                ) : notes.length === 0 ? (
                  <div className="text-center py-10 space-y-1 border border-dashed border-outline-variant/25 rounded-2xl bg-slate-50/50">
                    <MessageSquare className="w-8 h-8 text-on-surface-variant/30 mx-auto" />
                    <p className="text-xs text-on-surface-variant font-bold uppercase tracking-wide">No activities logged yet</p>
                    <p className="text-[10px] text-on-surface-variant/60">Be the first to record a meeting note or call trace.</p>
                  </div>
                ) : (
                  <div className="relative border-l-2 border-outline-variant/15 pl-4 ml-2.5 space-y-5">
                    {notes.map((n) => (
                      <div key={n.id} className="relative space-y-1.5 animate-fade-in text-xs">
                        {/* Timeline bubble */}
                        <span className="absolute -left-[23px] top-1.5 w-2.5 h-2.5 bg-primary rounded-full border border-white shadow-sm ring-4 ring-primary/10" />

                        <div className="flex items-center justify-between gap-4 flex-wrap text-[10px] font-bold text-on-surface-variant">
                          <span className="flex items-center gap-1 text-primary uppercase">
                            <User className="w-3.5 h-3.5" /> {n.authorName}
                          </span>
                          <span className="font-mono text-on-surface-variant/60 uppercase">
                            {new Date(n.createdAt).toLocaleString()}
                          </span>
                        </div>

                        <p className="text-on-surface/90 leading-relaxed bg-slate-50/50 p-3 rounded-2xl border border-outline-variant/5">
                          {n.content}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

          </div>
        )}

      </div>

    </div>
  );
}
