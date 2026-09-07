import React from 'react';
import { HomeTab as HomeLegacyView, HomeTabProps } from '../../components/HomeTab';

export interface HomePageProps extends HomeTabProps {}

export const HomePage: React.FC<HomePageProps> = (props) => {
  return <HomeLegacyView {...props} />;
};

export default HomePage;
