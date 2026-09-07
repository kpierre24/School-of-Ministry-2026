import React from 'react';
import { LibraryTab as LibraryLegacyView, LibraryTabProps } from '../../components/LibraryTab';

export interface LibraryPageProps extends LibraryTabProps {}

export const LibraryPage: React.FC<LibraryPageProps> = (props) => {
  return <LibraryLegacyView {...props} />;
};

export default LibraryPage;
