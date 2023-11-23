FROM mariadb:10

RUN apt-get update && apt-get -y install nano

EXPOSE 3306

CMD ["mysqld"]